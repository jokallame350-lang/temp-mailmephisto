
const fs = require('fs');

function replaceStr(file, search, replace) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes(search)) {
        console.warn('NOT FOUND:', search.substring(0, 30));
    } else {
        content = content.replace(search, replace);
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated', file);
    }
}

// SEOHead.tsx
replaceStr('src/components/SEOHead.tsx', 
    'MephistoMail - Gizliliðiniz Ýçin Nihai Kalkan | Geçici E-posta', 
    'MephistoMail - Gizliliðiniz Ýçin En Güvenli Geçici E-posta'
);
replaceStr('src/components/SEOHead.tsx', 
    'MephistoMail - The Ultimate Shield For Your Privacy | Disposable Email', 
    'MephistoMail - The Ultimate Privacy Focused Disposable Email'
);

// SEOContent.tsx
replaceStr('src/components/SEOContent.tsx', 
    'Ücretsiz deneme abonelikleri için mükemmel. Reklam izleyerek kredi kazanma sistemi adil ve rahatsýz edici deðil.', 
    'Ücretsiz deneme abonelikleri için mükemmel. Kayýt olmadan anýnda sýnýrsýz hesap açabiliyor olmak harika, tam aradýðým þey.'
);
replaceStr('src/components/SEOContent.tsx', 
    'Perfect for free trial subscriptions. The ad-for-credits system is fair and non-intrusive.', 
    'Perfect for free trial subscriptions. Being able to open unlimited accounts instantly without any registration is exactly what I needed.'
);

// translations.ts
replaceStr('src/translations.ts', 'noShield: \'No Shield Active\'', 'noShield: \'No Active Address\'');
replaceStr('src/translations.ts', 'noShield: \'Kalkan Aktif Deðil\'', 'noShield: \'Aktif Adres Yok\'');
replaceStr('src/translations.ts', 'noShield: \'Sin Escudo Activo\'', 'noShield: \'Sin Dirección Activa\'');
replaceStr('src/translations.ts', 'noShield: \'Kein Schutz aktiv\'', 'noShield: \'Keine aktive Adresse\'');
replaceStr('src/translations.ts', 'noShield: \'Aucun Bouclier Actif\'', 'noShield: \'Aucune Adresse Active\'');

replaceStr('src/translations.ts', 'noAccountTitle: \'No Active Shield\'', 'noAccountTitle: \'No Active Address\'');
replaceStr('src/translations.ts', 'noAccountTitle: \'Aktif Kalkan Yok\'', 'noAccountTitle: \'Aktif Adres Yok\'');
replaceStr('src/translations.ts', 'noAccountTitle: \'Sin Escudo Activo\'', 'noAccountTitle: \'Sin Dirección Activa\'');
replaceStr('src/translations.ts', 'noAccountTitle: \'Kein Schutz aktiv\'', 'noAccountTitle: \'Keine aktive Adresse\'');
replaceStr('src/translations.ts', 'noAccountTitle: \'Aucun Bouclier Actif\'', 'noAccountTitle: \'Aucune Adresse Active\'');

replaceStr('src/translations.ts', 
  'You start with 3 free email credits, and can earn more by watching a short optional ad. Every feature  custom addresses, password generator, QR transfer, email search, and up to 100 simultaneous mailboxes  is available at zero cost.', 
  'Start generating unlimited disposable email accounts instantly without registration. Every feature  custom addresses, password generator, fake identity generator, QR transfer, and up to 100 simultaneous mailboxes  is available at zero cost.'
);
replaceStr('src/translations.ts', 
  '3 ücretsiz e-posta hakký ile baþlarsýnýz, kýsa bir isteðe baðlý reklam izleyerek daha fazla hak kazanabilirsiniz. Özel adresler, þifre üretici, QR transferi, e-posta arama ve 100\'e kadar eþ zamanlý posta kutusu dahil tüm özellikler sýfýr maliyetle kullanýlabilir.', 
  'Hiçbir kayýt gerektirmeden anýnda sýnýrsýz sayýda geçici e-posta hesabý açabilirsiniz. Özel adresler, þifre üretici, sahte kimlik oluþturucu, QR transferi ve 100\'e kadar eþ zamanlý posta kutusu dahil tüm özellikler sýfýr maliyetle sýnýrsýz kullanýlabilir.'
);

