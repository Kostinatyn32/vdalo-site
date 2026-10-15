const encoder = new TextEncoder();

function byteLength(value) {
  return encoder.encode(value).length;
}

function escapeWifiValue(value) {
  return value.replace(/[\\;,:\"]/g, character => `\\${character}`);
}

export function buildWifiPayload({ ssid, password = '', security = 'WPA' }) {
  const network = String(ssid ?? '');
  const secret = security === 'nopass' ? '' : String(password ?? '');
  if (!network.trim()) throw new Error('Вкажіть назву Wi-Fi мережі.');
  if (byteLength(network) > 32) throw new Error('Назва Wi-Fi мережі має містити не більше 32 байтів UTF-8.');
  if (/[\u0000-\u001f\u007f]/.test(network)) throw new Error('Назва Wi-Fi мережі не може містити керівні символи.');
  if (!['WPA', 'WEP', 'nopass'].includes(security)) throw new Error('Оберіть тип захисту Wi-Fi мережі.');

  if (security === 'WPA') {
    const hexKey = /^[\da-f]{64}$/i.test(secret);
    if ((!hexKey && !/^[\x20-\x7e]{8,63}$/.test(secret))) {
      throw new Error('Пароль WPA/WPA2 має містити 8–63 друковані латинські символи або бути 64-значним шістнадцятковим ключем.');
    }
  } else if (security === 'WEP') {
    const hexKey = /^[\da-f]{10}(?:[\da-f]{16})?$/i.test(secret);
    if (!hexKey && !/^[\x20-\x7e]{5}(?:[\x20-\x7e]{8})?$/.test(secret)) {
      throw new Error('Пароль WEP має містити 5 або 13 друкованих латинських символів чи 10 або 26 шістнадцяткових знаків.');
    }
  }

  const escapedNetwork = escapeWifiValue(network);
  const escapedPassword = escapeWifiValue(security === 'nopass' ? '' : secret);
  return `WIFI:T:${security};S:${escapedNetwork};P:${escapedPassword};H:false;;`;
}
