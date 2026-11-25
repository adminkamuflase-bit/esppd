import { jsPDF } from 'jspdf';
import type { InstansiSettings, SppdRecord } from '../types/sppd';
import {
  formatTanggalIndonesia,
  numberToIndonesianWords,
} from './sppdLogic';

export type PrintableDocType = 'spd1' | 'spd2' | 'surat-tugas' | 'all';

function drawKemenagCrestVector(doc: jsPDF, cx: number, cy: number, size: number): void {
  const half = size / 2;
  doc.setDrawColor(0);
  doc.setLineWidth(0.35);

  // Pentagon shield
  const pts: Array<[number, number]> = [
    [cx, cy - half],
    [cx + half * 0.92, cy - half * 0.3],
    [cx + half * 0.58, cy + half * 0.88],
    [cx - half * 0.58, cy + half * 0.88],
    [cx - half * 0.92, cy - half * 0.3],
  ];
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    doc.line(x1, y1, x2, y2);
  }

  // Open book at bottom
  doc.rect(cx - half * 0.45, cy + half * 0.15, half * 0.45, half * 0.42);
  doc.rect(cx, cy + half * 0.15, half * 0.45, half * 0.42);

  // Star indicator at top
  doc.circle(cx, cy - half * 0.35, half * 0.16);
}

function drawKopSurat(doc: jsPDF, settings: InstansiSettings, margin: number, pageWidth: number): number {
  let y = 14;
  let drewCustomLogo = false;
  if (settings.logoDataUrl && settings.logoDataUrl.startsWith('data:image/')) {
    try {
      const format = settings.logoDataUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
      doc.addImage(settings.logoDataUrl, format, margin + 2, y + 1, 16, 16);
      drewCustomLogo = true;
    } catch {
      drewCustomLogo = false;
    }
  }
  if (!drewCustomLogo) {
    drawKemenagCrestVector(doc, margin + 10, y + 9, 16);
  }

  const centerX = (margin + 18 + (pageWidth - margin)) / 2;
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text(settings.kementerian.toUpperCase(), centerX, y + 3, { align: 'center' });
  doc.setFontSize(10.5);
  doc.text(settings.kanwil.toUpperCase(), centerX, y + 8, { align: 'center' });
  doc.setFontSize(12);
  doc.text(settings.kantorKabupaten.toUpperCase(), centerX, y + 13.5, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `${settings.alamatMadrasah} · Kode Pos ${settings.kodePos}`,
    centerX,
    y + 18,
    { align: 'center' },
  );
  doc.text(
    `Telp. ${settings.telepon} · Email: ${settings.email} · Website: ${settings.website}`,
    centerX,
    y + 22,
    { align: 'center' },
  );

  y += 25;
  doc.setLineWidth(0.7);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineWidth(0.25);
  doc.line(margin, y + 1, pageWidth - margin, y + 1);

  return y + 7;
}

function renderSpdPage1(doc: jsPDF, record: SppdRecord, settings: InstansiSettings): void {
  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 15;

  // Header top-left & top-right
  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.text(settings.kementerian.toUpperCase(), margin, y);
  doc.text(settings.kantorKabupaten.toUpperCase(), margin, y + 4.5);
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  const addrLines = doc.splitTextToSize(settings.alamatMadrasah, 90) as string[];
  doc.text(addrLines, margin, y + 9);

  const metaX = 128;
  doc.setFontSize(9);
  doc.text('Lembar Ke', metaX, y);
  doc.text(': 1 (Satu)', metaX + 20, y);
  doc.text('Kode No.', metaX, y + 4.5);
  doc.text(`: ${settings.kodeSatker}`, metaX + 20, y + 4.5);
  doc.text('Nomor', metaX, y + 9);
  doc.setFont('times', 'bold');
  doc.text(`: ${record.nomorSppd}`, metaX + 20, y + 9);

  y += 22;
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  const title = 'SURAT PERJALANAN DINAS (SPD)';
  doc.text(title, pageWidth / 2, y, { align: 'center' });
  const titleWidth = doc.getTextWidth(title);
  doc.setLineWidth(0.35);
  doc.line((pageWidth - titleWidth) / 2, y + 1, (pageWidth + titleWidth) / 2, y + 1);

  y += 6;
  const col1 = 10;
  const col2 = 68;
  const col3 = contentWidth - col1 - col2;
  const padX = 2.5;
  const padY = 3.8;
  const lineH = 4.4;

  const pengikutText =
    record.pengikut.length === 0
      ? '- (Tidak ada pengikut)'
      : record.pengikut
          .map(
            (p, idx) =>
              `${idx + 1}. ${p.nama}${p.nip ? ` (NIP. ${p.nip})` : ''} - ${p.keterangan}`,
          )
          .join('\n');

  const rows: Array<{ no: string; label: string[]; value: string[] }> = [
    {
      no: '1.',
      label: ['Pejabat Pembuat Komitmen'],
      value: [settings.ppkNama, `NIP. ${settings.ppkNip}`],
    },
    {
      no: '2.',
      label: ['Nama / NIP Pegawai yang melaksanakan perjalanan dinas'],
      value: [record.pegawaiNama, `NIP. ${record.pegawaiNip}`],
    },
    {
      no: '3.',
      label: [
        'a. Pangkat dan Golongan',
        'b. Jabatan / Instansi',
        'c. Tingkat Biaya Perjalanan Dinas',
      ],
      value: [
        `a. ${record.pegawaiPangkat}`,
        `b. ${record.pegawaiJabatan} / ${settings.namaMadrasah}`,
        `c. Tingkat ${record.tingkatBiaya}`,
      ],
    },
    {
      no: '4.',
      label: ['Maksud Perjalanan Dinas'],
      value: [record.maksudPerjalanan],
    },
    {
      no: '5.',
      label: ['Alat Angkut yang Dipergunakan'],
      value: [record.alatAngkut],
    },
    {
      no: '6.',
      label: ['a. Tempat Berangkat', 'b. Tempat Tujuan'],
      value: [`a. ${record.tempatBerangkat}`, `b. ${record.tempatTujuan}`],
    },
    {
      no: '7.',
      label: [
        'a. Lamanya Perjalanan Dinas',
        'b. Tanggal Berangkat',
        'c. Tanggal harus kembali / tiba di tempat baru *)',
      ],
      value: [
        `a. ${record.lamaHari} (${numberToIndonesianWords(record.lamaHari)}) hari`,
        `b. ${formatTanggalIndonesia(record.tanggalBerangkat)}`,
        `c. ${formatTanggalIndonesia(record.tanggalKembali)}`,
      ],
    },
    {
      no: '8.',
      label: ['Pengikut : Nama'],
      value: pengikutText.split('\n'),
    },
    {
      no: '9.',
      label: ['Pembebanan Anggaran', '   a. Instansi', '   b. Akun / Mata Anggaran'],
      value: ['', `a. ${record.sumberDana}`, `b. ${record.mataAnggaran}`],
    },
    {
      no: '10.',
      label: ['Keterangan lain-lain'],
      value: [record.keteranganLain || '-'],
    },
  ];

  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.setLineWidth(0.25);

  for (const row of rows) {
    const labelLines = row.label.flatMap((line) => doc.splitTextToSize(line, col2 - padX * 2) as string[]);
    const valueLines = row.value.flatMap((line) => doc.splitTextToSize(line, col3 - padX * 2) as string[]);
    const maxLines = Math.max(labelLines.length, valueLines.length, 1);
    const rowHeight = maxLines * lineH + padY * 1.4;

    doc.rect(margin, y, col1, rowHeight);
    doc.rect(margin + col1, y, col2, rowHeight);
    doc.rect(margin + col1 + col2, y, col3, rowHeight);

    doc.text(row.no, margin + col1 / 2, y + padY + 0.5, { align: 'center' });
    doc.text(labelLines, margin + col1 + padX, y + padY + 0.5);

    if (row.no === '1.' || row.no === '2.') {
      doc.setFont('times', 'bold');
      doc.text(valueLines[0] || '', margin + col1 + col2 + padX, y + padY + 0.5);
      doc.setFont('times', 'normal');
      if (valueLines.length > 1) {
        doc.text(valueLines.slice(1), margin + col1 + col2 + padX, y + padY + 0.5 + lineH);
      }
    } else {
      doc.text(valueLines, margin + col1 + col2 + padX, y + padY + 0.5);
    }

    y += rowHeight;
  }

  // Signature block
  y += 10;
  const sigX = 115;
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.text('Dikeluarkan di', sigX, y);
  doc.text(`: ${settings.tempatKedudukan}`, sigX + 26, y);
  doc.text('Tanggal', sigX, y + 5);
  doc.text(`: ${formatTanggalIndonesia(record.tanggalSurat)}`, sigX + 26, y + 5);

  doc.setFont('times', 'bold');
  doc.text('Pejabat Pembuat Komitmen,', sigX, y + 12);
  doc.text(settings.ppkNama, sigX, y + 30);
  const nameW = doc.getTextWidth(settings.ppkNama);
  doc.line(sigX, y + 30.8, sigX + nameW, y + 30.8);
  doc.setFont('times', 'normal');
  doc.text(`NIP. ${settings.ppkNip}`, sigX, y + 35);
}

function renderSpdPage2(doc: jsPDF, record: SppdRecord, settings: InstansiSettings): void {
  const pageWidth = 210;
  const margin = 15;
  const halfW = (pageWidth - margin * 2) / 2;
  let y = 15;

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setLineWidth(0.25);

  // Row I
  const h1 = 44;
  doc.rect(margin, y, halfW, h1);
  doc.rect(margin + halfW, y, halfW, h1);
  const rx = margin + halfW + 3;
  doc.setFont('times', 'bold');
  doc.text('I. Berangkat dari', rx, y + 5);
  doc.setFont('times', 'normal');
  doc.text(`: ${record.tempatBerangkat}`, rx + 26, y + 5);
  doc.text('(Tempat Kedudukan)', rx + 4, y + 9.5);
  doc.text(`Ke : ${record.tempatTujuan}`, rx + 4, y + 14);
  doc.text(`Pada Tanggal : ${formatTanggalIndonesia(record.tanggalBerangkat)}`, rx + 4, y + 18.5);
  doc.setFont('times', 'bold');
  doc.text(`Kepala ${settings.namaMadrasah} / PPK,`, rx, y + 24);
  doc.text(settings.kepalaMadrasahNama, rx, y + 37);
  doc.setFont('times', 'normal');
  doc.text(`NIP. ${settings.kepalaMadrasahNip}`, rx, y + 41.5);
  y += h1;

  // Row II
  const h2 = 44;
  doc.rect(margin, y, halfW, h2);
  doc.rect(margin + halfW, y, halfW, h2);
  doc.setFont('times', 'bold');
  doc.text('II. Tiba di :', margin + 3, y + 5);
  doc.setFont('times', 'normal');
  doc.text('.................................................', margin + 22, y + 5);
  doc.text('Pada Tanggal : ...........................................', margin + 5, y + 10);
  doc.text('Kepala / Pejabat yang Mengetahui,', margin + 3, y + 17);
  doc.text('( ...................................................... )', margin + 3, y + 37);
  doc.text('NIP.', margin + 3, y + 41.5);

  doc.setFont('times', 'bold');
  doc.text('Berangkat dari :', rx, y + 5);
  doc.setFont('times', 'normal');
  doc.text('...........................................', rx + 26, y + 5);
  doc.text('Ke : .........................................................', rx + 3, y + 10);
  doc.text('Pada Tanggal : ...........................................', rx + 3, y + 14.5);
  doc.text('Kepala / Pejabat yang Mengetahui,', rx, y + 20);
  doc.text('( ...................................................... )', rx, y + 37);
  doc.text('NIP.', rx, y + 41.5);
  y += h2;

  // Row III
  const h3 = 38;
  doc.rect(margin, y, halfW, h3);
  doc.rect(margin + halfW, y, halfW, h3);
  doc.setFont('times', 'bold');
  doc.text('III. Tiba di :', margin + 3, y + 5);
  doc.setFont('times', 'normal');
  doc.text('.................................................', margin + 24, y + 5);
  doc.text('Pada Tanggal : ...........................................', margin + 5, y + 10);
  doc.text('( ...................................................... )', margin + 3, y + 31);
  doc.text('NIP.', margin + 3, y + 35.5);

  doc.setFont('times', 'bold');
  doc.text('Berangkat dari :', rx, y + 5);
  doc.setFont('times', 'normal');
  doc.text('...........................................', rx + 26, y + 5);
  doc.text('Ke : .........................................................', rx + 3, y + 10);
  doc.text('Pada Tanggal : ...........................................', rx + 3, y + 14.5);
  doc.text('( ...................................................... )', rx, y + 31);
  doc.text('NIP.', rx, y + 35.5);
  y += h3;

  // Row IV
  const h4 = 46;
  doc.rect(margin, y, halfW, h4);
  doc.rect(margin + halfW, y, halfW, h4);
  doc.setFont('times', 'bold');
  doc.text('IV. Tiba di :', margin + 3, y + 5);
  doc.setFont('times', 'normal');
  doc.text('.................................................', margin + 23, y + 5);
  doc.text('(Tempat Kedudukan)', margin + 5, y + 9.5);
  doc.text('Pada Tanggal : ...........................................', margin + 5, y + 14);
  doc.setFont('times', 'bold');
  doc.text('Pejabat Pembuat Komitmen,', margin + 3, y + 21);
  doc.text(settings.ppkNama, margin + 3, y + 39);
  doc.setFont('times', 'normal');
  doc.text(`NIP. ${settings.ppkNip}`, margin + 3, y + 43.5);

  const checkText =
    'Telah diperiksa, dengan keterangan bahwa perjalanan tersebut atas perintahnya dan semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat-singkatnya.';
  doc.text(doc.splitTextToSize(checkText, halfW - 6) as string[], rx, y + 5);
  doc.setFont('times', 'bold');
  doc.text('Pejabat Pembuat Komitmen,', rx, y + 23);
  doc.text(settings.ppkNama, rx, y + 39);
  doc.setFont('times', 'normal');
  doc.text(`NIP. ${settings.ppkNip}`, rx, y + 43.5);
  y += h4;

  // Row V
  const catText = `V. Catatan Lain-lain : ${record.laporanRingkas || record.keteranganLain || '-'}`;
  const catLines = doc.splitTextToSize(catText, halfW * 2 - 6) as string[];
  const h5 = Math.max(12, catLines.length * 4.5 + 5);
  doc.rect(margin, y, halfW * 2, h5);
  doc.text(catLines, margin + 3, y + 5.5);
  y += h5;

  // Row VI
  const perhatianText =
    'PPK yang menerbitkan SPD, pegawai yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal berangkat/tiba, serta bendahara pengeluaran bertanggung jawab berdasarkan peraturan-peraturan Keuangan Negara apabila negara menderita rugi akibat kesalahan, kelalaian, dan kealpaannya.';
  const perLines = doc.splitTextToSize(perhatianText, halfW * 2 - 6) as string[];
  const h6 = perLines.length * 4.3 + 11;
  doc.rect(margin, y, halfW * 2, h6);
  doc.setFont('times', 'bold');
  doc.text('VI. PERHATIAN :', margin + 3, y + 5.5);
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.text(perLines, margin + 3, y + 10.5);
}

function renderSuratTugasPage(
  doc: jsPDF,
  record: SppdRecord,
  settings: InstansiSettings,
): void {
  const pageWidth = 210;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = drawKopSurat(doc, settings, margin, pageWidth);

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  const title = 'SURAT TUGAS';
  doc.text(title, pageWidth / 2, y + 2, { align: 'center' });
  const titleW = doc.getTextWidth(title);
  doc.line((pageWidth - titleW) / 2, y + 3, (pageWidth + titleW) / 2, y + 3);

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text(`Nomor : ${record.nomorSuratTugas}`, pageWidth / 2, y + 8, { align: 'center' });

  y += 16;
  const labelW = 28;
  const colonW = 4;
  const bodyX = margin + labelW + colonW;
  const bodyW = contentWidth - labelW - colonW;

  doc.setFont('times', 'bold');
  doc.text('Menimbang', margin, y);
  doc.text(':', margin + labelW, y);
  doc.setFont('times', 'normal');
  const menimbangLines = doc.splitTextToSize(
    `bahwa dalam rangka kelancaran pelaksanaan tugas kedinasan pada ${settings.namaMadrasah}, dipandang perlu menugaskan Pegawai / Guru yang namanya tersebut di bawah ini untuk melaksanakan perjalanan dinas sesuai ketentuan yang berlaku.`,
    bodyW,
  ) as string[];
  doc.text(menimbangLines, bodyX, y);
  y += menimbangLines.length * 5 + 4;

  doc.setFont('times', 'bold');
  doc.text('Dasar', margin, y);
  doc.text(':', margin + labelW, y);
  doc.setFont('times', 'normal');
  const dasarText =
    record.dasarSurat ||
    `Program Kerja ${settings.namaMadrasah} Tahun Anggaran ${settings.tahunAnggaran}.`;
  const dasarLines = doc.splitTextToSize(dasarText, bodyW) as string[];
  doc.text(dasarLines, bodyX, y);
  y += dasarLines.length * 5 + 7;

  doc.setFont('times', 'bold');
  doc.text('MEMBERI TUGAS', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.text('Kepada', margin, y);
  doc.text(':', margin + labelW, y);
  doc.setFont('times', 'normal');

  const drawPerson = (idx: number, nama: string, nip: string, pangkat?: string, jabatan?: string) => {
    doc.text(`${idx}. Nama`, bodyX, y);
    doc.text(':', bodyX + 30, y);
    doc.setFont('times', 'bold');
    doc.text(nama, bodyX + 33, y);
    doc.setFont('times', 'normal');
    y += 5;

    if (nip) {
      doc.text('NIP', bodyX + 4, y);
      doc.text(':', bodyX + 30, y);
      doc.text(nip, bodyX + 33, y);
      y += 5;
    }
    if (pangkat) {
      doc.text('Pangkat / Gol.', bodyX + 4, y);
      doc.text(':', bodyX + 30, y);
      doc.text(pangkat, bodyX + 33, y);
      y += 5;
    }
    if (jabatan) {
      doc.text('Jabatan', bodyX + 4, y);
      doc.text(':', bodyX + 30, y);
      doc.text(jabatan, bodyX + 33, y);
      y += 5;
    }
    y += 2;
  };

  drawPerson(1, record.pegawaiNama, record.pegawaiNip, record.pegawaiPangkat, record.pegawaiJabatan);
  record.pengikut.forEach((p, i) => {
    drawPerson(i + 2, p.nama, p.nip, undefined, p.keterangan);
  });

  y += 2;
  doc.setFont('times', 'bold');
  doc.text('Untuk', margin, y);
  doc.text(':', margin + labelW, y);
  doc.setFont('times', 'normal');
  const maksudLines = doc.splitTextToSize(record.maksudPerjalanan, bodyW) as string[];
  doc.text(maksudLines, bodyX, y);
  y += maksudLines.length * 5 + 3;

  const tglRange =
    record.tanggalKembali !== record.tanggalBerangkat
      ? `${formatTanggalIndonesia(record.tanggalBerangkat)} s.d. ${formatTanggalIndonesia(record.tanggalKembali)}`
      : formatTanggalIndonesia(record.tanggalBerangkat);

  doc.text('Hari / Tanggal', bodyX, y);
  doc.text(`: ${tglRange} (${record.lamaHari} hari)`, bodyX + 28, y);
  y += 5;
  doc.text('Tempat Tujuan', bodyX, y);
  doc.text(`: ${record.tempatTujuan}`, bodyX + 28, y);
  y += 10;

  const closingLines = doc.splitTextToSize(
    'Demikian Surat Tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab dan melaporkan hasilnya kepada Kepala Madrasah setelah selesai bertugas.',
    contentWidth,
  ) as string[];
  doc.text(closingLines, margin, y);
  y += closingLines.length * 5 + 10;

  const sigX = 118;
  doc.text(`Ditetapkan di : ${settings.tempatKedudukan}`, sigX, y);
  doc.text(`Pada Tanggal : ${formatTanggalIndonesia(record.tanggalSurat)}`, sigX, y + 5);
  doc.setFont('times', 'bold');
  doc.text('Kepala Madrasah,', sigX, y + 12);
  doc.text(settings.kepalaMadrasahNama, sigX, y + 30);
  const kNameW = doc.getTextWidth(settings.kepalaMadrasahNama);
  doc.line(sigX, y + 30.8, sigX + kNameW, y + 30.8);
  doc.setFont('times', 'normal');
  doc.text(`NIP. ${settings.kepalaMadrasahNip}`, sigX, y + 35);
}

export function buildSppdPdfFilename(record: SppdRecord, docType: PrintableDocType): string {
  const safeNo = record.nomorSppd.replace(/[^a-zA-Z0-9_-]/g, '_');
  if (docType === 'spd1') return `SPD_Halaman1_${safeNo}.pdf`;
  if (docType === 'spd2') return `SPD_Visum_${safeNo}.pdf`;
  if (docType === 'surat-tugas') return `Surat_Tugas_${safeNo}.pdf`;
  return `Paket_SPPD_${safeNo}.pdf`;
}

export function generateSppdPdf(
  record: SppdRecord,
  settings: InstansiSettings,
  docType: PrintableDocType,
): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  if (docType === 'spd1') {
    renderSpdPage1(doc, record, settings);
  } else if (docType === 'spd2') {
    renderSpdPage2(doc, record, settings);
  } else if (docType === 'surat-tugas') {
    renderSuratTugasPage(doc, record, settings);
  } else {
    renderSuratTugasPage(doc, record, settings);
    doc.addPage();
    renderSpdPage1(doc, record, settings);
    doc.addPage();
    renderSpdPage2(doc, record, settings);
  }

  const filename = buildSppdPdfFilename(record, docType);
  doc.save(filename);
  return filename;
}
