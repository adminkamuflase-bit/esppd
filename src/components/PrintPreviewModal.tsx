import React, { useState } from 'react';
import { Download, Printer, X } from 'lucide-react';
import type { InstansiSettings, SppdRecord } from '../types/sppd';
import {
  formatTanggalIndonesia,
  numberToIndonesianWords,
} from '../utils/sppdLogic';
import { generateSppdPdf, type PrintableDocType } from '../utils/pdfGenerator';
import { KemenagCrest } from './KemenagCrest';

type DocTab = 'spd1' | 'spd2' | 'surat-tugas';

interface PrintPreviewModalProps {
  record: SppdRecord | null;
  settings: InstansiSettings;
  onClose: () => void;
}

const KopSuratResmi: React.FC<{ settings: InstansiSettings }> = ({ settings }) => (
  <div className="border-b-[3px] border-double border-black pb-2.5 mb-4">
    <div className="flex items-center gap-4">
      {settings.logoDataUrl ? (
        <img
          src={settings.logoDataUrl}
          alt={`Logo ${settings.namaMadrasah}`}
          referrerPolicy="no-referrer"
          className="h-16 w-16 shrink-0 object-contain"
        />
      ) : (
        <KemenagCrest variant="monochrome" className="h-16 w-16 shrink-0" />
      )}
      <div className="flex-1 text-center leading-tight">
        <p className="text-[11pt] font-bold tracking-wide uppercase text-black">
          {settings.kementerian}
        </p>
        <p className="text-[10.5pt] font-bold tracking-wide uppercase text-black">
          {settings.kanwil}
        </p>
        <p className="text-[12pt] font-bold tracking-wide uppercase text-black">
          {settings.kantorKabupaten}
        </p>
        <p className="mt-0.5 text-[8.5pt] text-black">
          {settings.alamatMadrasah} · Kode Pos {settings.kodePos}
        </p>
        <p className="text-[8.5pt] text-black">
          Telp. {settings.telepon} · Email: {settings.email} · Website: {settings.website}
        </p>
      </div>
    </div>
  </div>
);

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  record,
  settings,
  onClose,
}) => {
  const [activeDoc, setActiveDoc] = useState<DocTab>('spd1');
  const [printFeedback, setPrintFeedback] = useState<string | null>(null);

  if (!record) return null;

  const handleDownloadPdf = (mode: PrintableDocType) => {
    const filename = generateSppdPdf(record, settings, mode);
    setPrintFeedback(`File PDF siap dicetak: ${filename}`);
  };

  const handleBrowserPrint = () => {
    const inIframe = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

    window.print();

    if (inIframe) {
      setPrintFeedback(
        'Dialog cetak browser dibuka. Jika pratinjau terblokir oleh frame, gunakan tombol "Unduh PDF (A4)" untuk mencetak langsung dari file PDF.',
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs p-4 sm:p-6 print-only-container"
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-preview-title"
    >
      <div className="mx-auto max-w-[230mm] space-y-4 print-only-container">
        {/* Non-printable toolbar */}
        <div className="no-print rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-lg space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="print-preview-title" className="sr-only">
                Pratinjau Cetak Dokumen SPPD {record.nomorSppd}
              </h2>
              <div
                role="tablist"
                aria-label="Jenis dokumen resmi"
                className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1"
              >
                {(
                  [
                    { id: 'spd1', label: 'SPD Halaman 1' },
                    { id: 'spd2', label: 'SPD Halaman 2 (Visum)' },
                    { id: 'surat-tugas', label: 'Surat Tugas' },
                  ] as Array<{ id: DocTab; label: string }>
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeDoc === tab.id}
                    onClick={() => {
                      setActiveDoc(tab.id);
                      setPrintFeedback(null);
                    }}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      activeDoc === tab.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadPdf(activeDoc)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-medium text-white hover:bg-emerald-900 whitespace-nowrap shrink-0"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>Unduh PDF (A4)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPdf('all')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800/30 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900 hover:bg-emerald-100 whitespace-nowrap shrink-0"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Unduh Lengkap (3 Hal.)</span>
              </button>
              <button
                type="button"
                onClick={handleBrowserPrint}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                <span>Cetak Langsung</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup pratinjau cetak"
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {printFeedback && (
            <p
              role="status"
              className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2"
            >
              {printFeedback}
            </p>
          )}
        </div>

        {/* Printable A4 Sheet */}
        <div className="print-sheet mx-auto bg-white p-8 sm:p-12 shadow-xl border border-slate-200 text-black font-serif text-[10pt] leading-snug">
          {/* TAB 1: SPD HALAMAN 1 */}
          {activeDoc === 'spd1' && (
            <div>
              <div className="flex justify-between items-start mb-4 text-[9pt]">
                <div>
                  <p className="font-bold uppercase">{settings.kementerian}</p>
                  <p className="font-bold uppercase">{settings.kantorKabupaten}</p>
                  <p>{settings.alamatMadrasah}</p>
                </div>
                <table className="text-[9pt]">
                  <tbody>
                    <tr>
                      <td className="pr-2">Lembar Ke</td>
                      <td className="pr-1">:</td>
                      <td>1 (Satu)</td>
                    </tr>
                    <tr>
                      <td className="pr-2">Kode No.</td>
                      <td className="pr-1">:</td>
                      <td className="font-mono">{settings.kodeSatker}</td>
                    </tr>
                    <tr>
                      <td className="pr-2">Nomor</td>
                      <td className="pr-1">:</td>
                      <td className="font-mono font-semibold">{record.nomorSppd}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-center text-[11.5pt] font-bold underline tracking-wide mb-4">
                SURAT PERJALANAN DINAS (SPD)
              </h3>

              <table className="w-full border-collapse border border-black text-[9.5pt]">
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1.5 text-center w-8 align-top">1.</td>
                    <td className="border border-black px-2.5 py-1.5 w-[38%] align-top">
                      Pejabat Pembuat Komitmen
                    </td>
                    <td className="border border-black px-2.5 py-1.5 align-top font-semibold">
                      {settings.ppkNama}
                      <div className="font-normal text-[8.5pt]">NIP. {settings.ppkNip}</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 text-center align-top">2.</td>
                    <td className="border border-black px-2.5 py-1.5 align-top">
                      Nama / NIP Pegawai yang melaksanakan perjalanan dinas
                    </td>
                    <td className="border border-black px-2.5 py-1.5 align-top">
                      <div className="font-semibold">{record.pegawaiNama}</div>
                      <div className="text-[8.5pt]">NIP. {record.pegawaiNip}</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 text-center align-top">3.</td>
                    <td className="border border-black px-2.5 py-1.5 align-top">
                      <div>a. Pangkat dan Golongan</div>
                      <div>b. Jabatan / Instansi</div>
                      <div>c. Tingkat Biaya Perjalanan Dinas</div>
                    </td>
                    <td className="border border-black px-2.5 py-1.5 align-top">
                      <div>a. {record.pegawaiPangkat}</div>
                      <div>b. {record.pegawaiJabatan} / {settings.namaMadrasah}</div>
                      <div>c. Tingkat {record.tingkatBiaya}</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 text-center align-top">4.</td>
                    <td className="border border-black px-2.5 py-1.5 align-top">
                      Maksud Perjalanan Dinas
                    </td>
                    <td className="border border-black px-2.5 py-1.5 align-top">
                      {record.maksudPerjalanan}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 text-center align-top">5.</td>
                    <td className="border border-black px-2.5 py-1.5 align-top">
                      Alat Angkut yang Dipergunakan
                    </td>
                    <td className="border border-black px-2.5 py-1.5 align-top">
                      {record.alatAngkut}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 text-center align-top">6.</td>
                    <td className="border border-black px-2.5 py-1.5 align-top">
                      <div>a. Tempat Berangkat</div>
                      <div>b. Tempat Tujuan</div>
                    </td>
                    <td className="border border-black px-2.5 py-1.5 align-top">
                      <div>a. {record.tempatBerangkat}</div>
                      <div>b. {record.tempatTujuan}</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 text-center align-top">7.</td>
                    <td className="border border-black px-2.5 py-1.5 align-top">
                      <div>a. Lamanya Perjalanan Dinas</div>
                      <div>b. Tanggal Berangkat</div>
                      <div>c. Tanggal harus kembali / tiba di tempat baru *)</div>
                    </td>
                    <td className="border border-black px-2.5 py-1.5 align-top">
                      <div>a. {record.lamaHari} ({numberToIndonesianWords(record.lamaHari)}) hari</div>
                      <div>b. {formatTanggalIndonesia(record.tanggalBerangkat)}</div>
                      <div>c. {formatTanggalIndonesia(record.tanggalKembali)}</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 text-center align-top">8.</td>
                    <td className="border border-black px-2.5 py-1.5 align-top">
                      Pengikut : Nama
                    </td>
                    <td className="border border-black px-2.5 py-1.5 align-top">
                      {record.pengikut.length === 0 ? (
                        <span>- (Tidak ada pengikut)</span>
                      ) : (
                        <ol className="list-decimal pl-4 space-y-0.5">
                          {record.pengikut.map((p) => (
                            <li key={p.id}>
                              {p.nama} {p.nip ? `(NIP. ${p.nip})` : ''} — {p.keterangan}
                            </li>
                          ))}
                        </ol>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 text-center align-top">9.</td>
                    <td className="border border-black px-2.5 py-1.5 align-top">
                      <div>Pembebanan Anggaran</div>
                      <div className="pl-3">a. Instansi</div>
                      <div className="pl-3">b. Akun / Mata Anggaran</div>
                    </td>
                    <td className="border border-black px-2.5 py-1.5 align-top">
                      <div>&nbsp;</div>
                      <div>a. {record.sumberDana}</div>
                      <div>b. {record.mataAnggaran}</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 text-center align-top">10.</td>
                    <td className="border border-black px-2.5 py-1.5 align-top">
                      Keterangan lain-lain
                    </td>
                    <td className="border border-black px-2.5 py-1.5 align-top">
                      {record.keteranganLain || '-'}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-6 flex justify-end break-inside-avoid">
                <div className="w-[46%] text-[9.5pt]">
                  <table className="w-full mb-2">
                    <tbody>
                      <tr>
                        <td className="w-28">Dikeluarkan di</td>
                        <td className="w-3">:</td>
                        <td>{settings.tempatKedudukan}</td>
                      </tr>
                      <tr>
                        <td>Tanggal</td>
                        <td>:</td>
                        <td>{formatTanggalIndonesia(record.tanggalSurat)}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="font-semibold">Pejabat Pembuat Komitmen,</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{settings.ppkNama}</p>
                  <p>NIP. {settings.ppkNip}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SPD HALAMAN 2 (VISUM) */}
          {activeDoc === 'spd2' && (
            <div>
              <table className="w-full border-collapse border border-black text-[9pt]">
                <tbody>
                  {/* Row I */}
                  <tr>
                    <td className="border border-black p-2.5 w-1/2 align-top">&nbsp;</td>
                    <td className="border border-black p-2.5 w-1/2 align-top">
                      <p>
                        <strong>I. Berangkat dari</strong> : {record.tempatBerangkat}
                      </p>
                      <p className="pl-4">(Tempat Kedudukan)</p>
                      <p className="pl-4">Ke : {record.tempatTujuan}</p>
                      <p className="pl-4">Pada Tanggal : {formatTanggalIndonesia(record.tanggalBerangkat)}</p>
                      <p className="mt-2 font-semibold">Kepala {settings.namaMadrasah},</p>
                      <div className="h-12" />
                      <p className="font-bold underline">{settings.kepalaMadrasahNama}</p>
                      <p>NIP. {settings.kepalaMadrasahNip}</p>
                    </td>
                  </tr>

                  {/* Row II */}
                  <tr>
                    <td className="border border-black p-2.5 align-top">
                      <p>
                        <strong>II. Tiba di</strong> : ................................................
                      </p>
                      <p className="pl-5">Pada Tanggal : ................................................</p>
                      <p className="mt-2">Kepala / Pejabat yang Mengetahui,</p>
                      <div className="h-14" />
                      <p>( ............................................................ )</p>
                      <p>NIP.</p>
                    </td>
                    <td className="border border-black p-2.5 align-top">
                      <p>
                        <strong>Berangkat dari</strong> : ................................................
                      </p>
                      <p className="pl-4">Ke : ................................................</p>
                      <p className="pl-4">Pada Tanggal : ................................................</p>
                      <p className="mt-2">Kepala / Pejabat yang Mengetahui,</p>
                      <div className="h-14" />
                      <p>( ............................................................ )</p>
                      <p>NIP.</p>
                    </td>
                  </tr>

                  {/* Row III */}
                  <tr>
                    <td className="border border-black p-2.5 align-top">
                      <p>
                        <strong>III. Tiba di</strong> : ................................................
                      </p>
                      <p className="pl-6">Pada Tanggal : ................................................</p>
                      <div className="h-14" />
                      <p>( ............................................................ )</p>
                      <p>NIP.</p>
                    </td>
                    <td className="border border-black p-2.5 align-top">
                      <p>
                        <strong>Berangkat dari</strong> : ................................................
                      </p>
                      <p className="pl-4">Ke : ................................................</p>
                      <p className="pl-4">Pada Tanggal : ................................................</p>
                      <div className="h-14" />
                      <p>( ............................................................ )</p>
                      <p>NIP.</p>
                    </td>
                  </tr>

                  {/* Row IV */}
                  <tr>
                    <td className="border border-black p-2.5 align-top">
                      <p>
                        <strong>IV. Tiba di</strong> : ................................................
                      </p>
                      <p className="pl-6">(Tempat Kedudukan)</p>
                      <p className="pl-6">Pada Tanggal : ................................................</p>
                      <p className="mt-2 font-semibold">Pejabat Pembuat Komitmen,</p>
                      <div className="h-12" />
                      <p className="font-bold underline">{settings.ppkNama}</p>
                      <p>NIP. {settings.ppkNip}</p>
                    </td>
                    <td className="border border-black p-2.5 align-top">
                      <p className="leading-snug">
                        Telah diperiksa, dengan keterangan bahwa perjalanan tersebut atas perintahnya
                        dan semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat-singkatnya.
                      </p>
                      <p className="mt-3 font-semibold">Pejabat Pembuat Komitmen,</p>
                      <div className="h-12" />
                      <p className="font-bold underline">{settings.ppkNama}</p>
                      <p>NIP. {settings.ppkNip}</p>
                    </td>
                  </tr>

                  {/* Row V */}
                  <tr>
                    <td colSpan={2} className="border border-black p-2.5">
                      <p>
                        <strong>V. Catatan Lain-lain :</strong>{' '}
                        {record.laporanRingkas || record.keteranganLain || '-'}
                      </p>
                    </td>
                  </tr>

                  {/* Row VI */}
                  <tr>
                    <td colSpan={2} className="border border-black p-2.5 text-[8.5pt]">
                      <p className="font-bold">VI. PERHATIAN :</p>
                      <p className="mt-0.5 leading-snug">
                        PPK yang menerbitkan SPD, pegawai yang melakukan perjalanan dinas, para
                        pejabat yang mengesahkan tanggal berangkat/tiba, serta bendahara pengeluaran
                        bertanggung jawab berdasarkan peraturan-peraturan Keuangan Negara apabila
                        negara menderita rugi akibat kesalahan, kelalaian, dan kealpaannya.
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: SURAT TUGAS */}
          {activeDoc === 'surat-tugas' && (
            <div>
              <KopSuratResmi settings={settings} />

              <div className="text-center my-4">
                <h3 className="text-[12pt] font-bold underline tracking-wider uppercase">
                  SURAT TUGAS
                </h3>
                <p className="font-mono text-[10pt] mt-0.5">Nomor : {record.nomorSuratTugas}</p>
              </div>

              <table className="w-full text-[10pt] mt-5 leading-relaxed">
                <tbody>
                  <tr>
                    <td className="w-28 align-top font-semibold py-1.5">Menimbang</td>
                    <td className="w-4 align-top py-1.5">:</td>
                    <td className="align-top py-1.5 text-justify">
                      bahwa dalam rangka kelancaran pelaksanaan tugas kedinasan pada{' '}
                      {settings.namaMadrasah}, dipandang perlu menugaskan Pegawai / Guru yang
                      namanya tersebut di bawah ini untuk melaksanakan perjalanan dinas sesuai
                      ketentuan yang berlaku.
                    </td>
                  </tr>
                  <tr>
                    <td className="align-top font-semibold py-1.5">Dasar</td>
                    <td className="align-top py-1.5">:</td>
                    <td className="align-top py-1.5 text-justify">
                      {record.dasarSurat ||
                        `Program Kerja dan Anggaran DIPA ${settings.namaMadrasah} Tahun Anggaran ${settings.tahunAnggaran}.`}
                    </td>
                  </tr>
                </tbody>
              </table>

              <p className="text-center font-bold tracking-wider uppercase my-4">
                MEMBERI TUGAS
              </p>

              <table className="w-full text-[10pt] leading-relaxed">
                <tbody>
                  <tr>
                    <td className="w-28 align-top font-semibold py-1.5">Kepada</td>
                    <td className="w-4 align-top py-1.5">:</td>
                    <td className="align-top py-1.5">
                      <table className="w-full">
                        <tbody>
                          <tr>
                            <td className="w-36">1. Nama</td>
                            <td className="w-3">:</td>
                            <td className="font-semibold">{record.pegawaiNama}</td>
                          </tr>
                          <tr>
                            <td className="pl-4">NIP</td>
                            <td>:</td>
                            <td className="font-mono">{record.pegawaiNip}</td>
                          </tr>
                          <tr>
                            <td className="pl-4">Pangkat / Gol.</td>
                            <td>:</td>
                            <td>{record.pegawaiPangkat}</td>
                          </tr>
                          <tr>
                            <td className="pl-4">Jabatan</td>
                            <td>:</td>
                            <td>{record.pegawaiJabatan}</td>
                          </tr>
                        </tbody>
                      </table>
                      {record.pengikut.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {record.pengikut.map((p, idx) => (
                            <table key={p.id} className="w-full">
                              <tbody>
                                <tr>
                                  <td className="w-36">{idx + 2}. Nama</td>
                                  <td className="w-3">:</td>
                                  <td className="font-semibold">{p.nama}</td>
                                </tr>
                                {p.nip && (
                                  <tr>
                                    <td className="pl-4">NIP</td>
                                    <td>:</td>
                                    <td className="font-mono">{p.nip}</td>
                                  </tr>
                                )}
                                <tr>
                                  <td className="pl-4">Keterangan</td>
                                  <td>:</td>
                                  <td>{p.keterangan}</td>
                                </tr>
                              </tbody>
                            </table>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="align-top font-semibold py-2">Untuk</td>
                    <td className="align-top py-2">:</td>
                    <td className="align-top py-2 text-justify">
                      <p>{record.maksudPerjalanan}</p>
                      <table className="mt-2">
                        <tbody>
                          <tr>
                            <td className="w-32">Hari / Tanggal</td>
                            <td className="w-3">:</td>
                            <td>
                              {formatTanggalIndonesia(record.tanggalBerangkat)}
                              {record.tanggalKembali !== record.tanggalBerangkat
                                ? ` s.d. ${formatTanggalIndonesia(record.tanggalKembali)}`
                                : ''}{' '}
                              ({record.lamaHari} hari)
                            </td>
                          </tr>
                          <tr>
                            <td>Tempat Tujuan</td>
                            <td>:</td>
                            <td>{record.tempatTujuan}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>

              <p className="mt-4 text-[10pt] text-justify">
                Demikian Surat Tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab dan
                melaporkan hasilnya kepada Kepala Madrasah setelah selesai bertugas.
              </p>

              <div className="mt-8 flex justify-end break-inside-avoid">
                <div className="w-[45%] text-[10pt]">
                  <p>Ditetapkan di : {settings.tempatKedudukan}</p>
                  <p>Pada Tanggal : {formatTanggalIndonesia(record.tanggalSurat)}</p>
                  <p className="mt-2 font-semibold">Kepala Madrasah,</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{settings.kepalaMadrasahNama}</p>
                  <p>NIP. {settings.kepalaMadrasahNip}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
