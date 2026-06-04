# Security Specification for Downloads Collection

## 1. Data Invariants
- A download document must have an auto-generated unique ID matching `^[a-zA-Z0-9_\-]+$`.
- The `imageUrl` must be a non-empty string representing base64-encoded image data, with length greater than 0 and less than 1,000,000 characters to prevent Firestore document storage overflow (>1MB).
- The `fileName` must be a string up to 200 characters long.
- The `format` must be exactly `"png"`, `"webp"`, or `"jpeg"`.
- The `size` must be an integer (e.g., 500, 1000, etc.) between 100 and 3000.
- The `downloadedAt` timestamp must equal the server transaction timestamp `request.time`.

## 2. The "Dirty Dozen" Payloads (Vulnerability Vectors)
1. **Unsigned Write**: Action initiated by any client (downloads are public-submittable, but let's determine if anonymous read/write is allowed. Since there's no mandatory sign-in required to download, we allow anyone to create download records, but write-operations must be securely constrained).
2. **Ghost Field / Shadow Update**: Creating a document with extra properties like `{ "isAdmin": true, "vip": true }`.
3. **Invalid Format**: Value other than `png`, `webp`, `jpeg`, e.g., `"exe"` or `"sh"`.
4. **Invalid size**: Extremely huge size number, e.g., `-999` or `9999999`.
5. **Client-Spoofed Time**: Forcing `downloadedAt` to be in the future or past instead of `request.time`.
6. **No File Name**: `fileName` field missing.
7. **No Image Data**: `imageUrl` field missing.
8. **Malicious ID injection**: Document ID with directory traversal or massive payloads e.g. `../../etc` of size `>128` chars.
9. **Update Violation**: Standard users or third parties attempting to modify/edit an existing download history.
10. **Delete Violation**: Standard users or third parties attempting to delete a download history.
11. ** PI Leakage**: Blanket queries fetching download logs of other users (or since it's anonymous, we can restrict read/get to creator if using auth, or lock reads entirely so people can only save downloads but not list other people's image data).
12. **Extreme String Payload**: Injecting a 10MB string into `fileName` causing Denial of Wallet.

## 3. Security Rule Verification Strategy / Fortress Rules
To address these vulnerabilities:
- Allow `create` with validation: `isValidId(downloadId) && isValidDownload(request.resource.data)`.
- Disallow `update` and `delete` entirely (records are immutable audit logs).
- Disallow `list` reads entirely to prevent public data scraping and heavy list read costs, or restrict `get` to specific items only.
