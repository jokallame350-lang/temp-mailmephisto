
const fs = require('fs');

let file = 'src/translations.ts';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  ['noAccountTitle: \'No Active Shield\'', 'noAccountTitle: \'No Active Address\''],
  ['noShield: \'No Shield Active\'', 'noShield: \'No Active Address\''],
  ['noAccountTitle: \'Aktif Kalkan Yok\'', 'noAccountTitle: \'Aktif Adres Yok\''],
  ['noShield: \'Kalkan Aktif Değil\'', 'noShield: \'Aktif Adres Yok\''],
  ['noAccountTitle: \'Sin Escudo Activo\'', 'noAccountTitle: \'Sin Dirección Activa\''],
  ['noShield: \'Sin Escudo Activo\'', 'noShield: \'Sin Dirección Activa\''],
  ['noAccountTitle: \'Kein Schutz aktiv\'', 'noAccountTitle: \'Keine aktive Adresse\''],
  ['noShield: \'Kein Schutz aktiv\'', 'noShield: \'Keine aktive Adresse\''],
  ['noAccountTitle: \'Aucun Bouclier Actif\'', 'noAccountTitle: \'Aucune Adresse Active\''],
  ['noShield: \'Aucun Bouclier Actif\'', 'noShield: \'Aucune Adresse Active\''],
  ['You start with 3 free email credits, and can earn more by watching a short optional ad. Every feature  custom addresses, password generator, QR transfer, email search, and up to 100 simultaneous mailboxes  is available at zero cost.', 'Start generating unlimited disposable email accounts instantly without registration. Every feature  custom addresses, password generator, fake identity generator, QR transfer, and up to 100 simultaneous mailboxes  is available at zero cost.'],
  ['3 ücretsiz e-posta hakkı ile başlarsınız, kısa bir isteğe bağlı reklam izleyerek daha fazla hak kazanabilirsiniz. Özel adresler, şifre üretici, QR transferi, e-posta arama ve 100\'e kadar eş zamanlı posta kutusu dahil tüm özellikler sıfır maliyetle kullanılabilir.', 'Hiçbir kayıt gerektirmeden anında sınırsız sayıda geçici e-posta hesabı açabilirsiniz. Özel adresler, şifre üretici, sahte kimlik oluşturucu, QR transferi ve 100\'e kadar eş zamanlı posta kutusu dahil tüm özellikler sıfır maliyetle sınırsız kullanılabilir.']
];

for (let r of replacements) {
  content = content.replace(r[0], r[1]);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');

