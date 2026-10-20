// GitHub Pages gibi yönlendirme kuralı desteklemeyen barındırıcılar için: bilinmeyen adresler uygulamayı açsın
import fs from 'fs';
fs.copyFileSync('dist/index.html', 'dist/404.html');
console.log('dist/404.html oluşturuldu');
