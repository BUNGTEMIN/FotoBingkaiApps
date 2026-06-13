/**
 * Utilitas Penyaringan Teks Sederhana (Sensor Kata Kasar)
 * Dibuat oleh Olaive untuk Abang Baim sayang 💕
 */

// Daftar kata-kata tidak pantas/kasar secara umum (indonesia & english)
const BAD_WORDS_LIST = [
  'anjing', 'anjing', 'babi', 'bangsat', 'bangsad', 'goblok', 'gblk', 
  'tolol', 'kontol', 'kntl', 'memek', 'memeq', 'bajingan', 'bajing', 
  'bego', 'peler', 'pler', 'pantek', 'jancok', 'jancuk', 'ngentot', 
  'ngentod', 'ngntt', 'kampret', 'bangke', 'goblok', 'itil', 'perek', 
  'tetek', 'toket', 'fuck', 'shit', 'asshole', 'bitch', 'damn', 'pussy'
];

/**
 * Menyaring kata-kata tidak pantas dari teks komentar.
 * Mencari kecocokan kata (case-insensitive) dan menggantinya dengan karakter sensor (seperti *** atau bintang-bintang).
 */
export const filterInappropriateText = (text: string): string => {
  if (!text) return '';

  let sanitized = text;

  // Lakukan iterasi setiap kata kasar untuk disensor
  BAD_WORDS_LIST.forEach((badWord) => {
    // Buat regular expression pencarian global dan case-insensitive
    // Menggunakan word boundary (\b) atau secara fleksibel mendeteksi substring di dalam kalimat
    // Biar lebih akurat, kita gunakan penanganan kata utuh atau penanganan substring fleksibel
    try {
      // Escape badword agar aman dalam regex
      const escapedWord = badWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      
      // Mengganti semua kemunculan kata kasar dengan karakter bintang (*) dengan panjang yang setara
      const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
      sanitized = sanitized.replace(regex, (match) => {
        return '*'.repeat(match.length);
      });

      // Juga bersihkan pencarian fleksibel untuk kata-kata ekstra kasar yang disisipi karakter lain
      const flexibleRegex = new RegExp(escapedWord, 'gi');
      if (badWord.length > 3) {
        sanitized = sanitized.replace(flexibleRegex, (match) => {
          return match[0] + '*'.repeat(match.length - 2) + match[match.length - 1];
        });
      }
    } catch (e) {
      console.error("Kesalahan penyaringan kata:", e);
    }
  });

  return sanitized;
};

/**
 * Memeriksa apakah teks mengandung kata-kata kasar.
 */
export const hasInappropriateWords = (text: string): boolean => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return BAD_WORDS_LIST.some((badWord) => {
    const regex = new RegExp(`\\b${badWord}\\b`, 'i');
    return regex.test(lowerText);
  });
};
