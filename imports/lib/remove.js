import FS from 'fs';
import { promises as FSP } from 'fs';

export function removePath(pathname) {
  FSP.rm(pathname)
  .then(() => {
    console.log(`Deleted ${pathname}`)
  })
  .catch((err) => {
    console.log(`Failed to delete ${pathname}: ${err}`)
  });
}
