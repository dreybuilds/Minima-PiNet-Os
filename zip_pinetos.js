import AdmZip from 'adm-zip';
import path from 'path';

const zip = new AdmZip();
zip.addLocalFolder(path.join(process.cwd(), 'PiNetOS'), 'PiNetOS');
zip.writeZip(path.join(process.cwd(), 'PiNetOS-Enterprise.zip'));
console.log('Successfully created PiNetOS-Enterprise.zip');
