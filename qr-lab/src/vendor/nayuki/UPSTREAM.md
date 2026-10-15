# Nayuki source provenance

- Upstream project: Project Nayuki QR Code Generator
- Source file: `typescript-javascript/qrcodegen.ts`
- Pinned revision: `3c6d0b3cefb4e049dc337e82237c9644399716a8`
- Immutable source URL: https://github.com/nayuki/QR-Code-generator/blob/3c6d0b3cefb4e049dc337e82237c9644399716a8/typescript-javascript/qrcodegen.ts
- License: MIT, retained in the source file header
- Local vendored file SHA-256, including the Vite export shim: `663FA045A0278D04B3EC6B10B42BD3AB892061FA1CDDA3414693C9B7920AE36F`

The only local source addition is the final `export { qrcodegen };` statement, required to import the upstream namespace as an ES module in the isolated Vite lab. The QR encoder implementation and MIT notice remain upstream code. The file was reviewed against the immutable upstream source endpoint; the hash above identifies the local copy including the shim.
