export type SppdStatus = 'Draft' | 'Disetujui' | 'Selesai';

export type TingkatBiaya = 'A' | 'B' | 'C' | 'D';

export type StatusKepegawaian = 'PNS' | 'PPPK' | 'Non-ASN';

export interface Pegawai {
  id: string;
  nama: string;
  nip: string;
  pangkatGolongan: string;
  jabatan: string;
  tingkatBiaya: TingkatBiaya;
  statusKepegawaian: StatusKepegawaian;
  unitKerja: string;
}

export interface Pengikut {
  id: string;
  nama: string;
  nip: string;
  keterangan: string;
}

export interface RincianBiaya {
  uangHarianPerHari: number;
  transportPergiPulang: number;
  biayaPenginapanPerMalam: number;
  jumlahMalam: number;
  uangRepresentasi: number;
  pengeluaranRiil: number;
  keteranganBiaya: string;
}

export interface SppdRecord {
  id: string;
  nomorSppd: string;
  nomorSuratTugas: string;
  tanggalSurat: string; // YYYY-MM-DD
  pegawaiId: string;
  pegawaiNama: string;
  pegawaiNip: string;
  pegawaiPangkat: string;
  pegawaiJabatan: string;
  tingkatBiaya: TingkatBiaya;
  maksudPerjalanan: string;
  dasarSurat: string;
  alatAngkut: string;
  tempatBerangkat: string;
  tempatTujuan: string;
  instansiTujuan: string;
  tanggalBerangkat: string; // YYYY-MM-DD
  tanggalKembali: string; // YYYY-MM-DD
  lamaHari: number;
  pengikut: Pengikut[];
  sumberDana: string;
  mataAnggaran: string;
  keteranganLain: string;
  pejabatMengetahuiTujuan: string;
  biaya: RincianBiaya;
  totalBiaya: number;
  status: SppdStatus;
  laporanRingkas: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstansiSettings {
  kementerian: string;
  kanwil: string;
  kantorKabupaten: string;
  namaMadrasah: string;
  alamatMadrasah: string;
  telepon: string;
  email: string;
  website: string;
  kodePos: string;
  tempatKedudukan: string;
  kodeSatker: string;
  tahunAnggaran: string;
  kepalaMadrasahNama: string;
  kepalaMadrasahNip: string;
  ppkNama: string;
  ppkNip: string;
  bendaharaNama: string;
  bendaharaNip: string;
  awalanNomorSurat: string;
  kodeKlasifikasiSurat: string;
  logoDataUrl?: string;
}

export interface AppDatabase {
  settings: InstansiSettings;
  pegawai: Pegawai[];
  sppd: SppdRecord[];
}
