

# SSA Manager Sample

**SSA Manager** is a simple web-based tool that helps you manage **Secure Service Accounts (SSAs)** for Autodesk Platform Services (APS). It provides a developer-friendly interface to create service accounts, manage keys, and generate access tokens.

> Maintained by the Autodesk Developer Advocate Support Team  
> Licensed under the [MIT License](LICENSE)

---
<kbd>
<img width="1290" alt="Image" src="https://github.com/user-attachments/assets/ffb940d2-3421-4b37-a8d1-c94e9d43eb64" />
</kbd>

---

## 🚀 Features

- **Accounts**  
  Easily create new service accounts by providing a name. Click the `Create Account With Name:` button to initiate the creation process.

- **Keys**  
  When creating a key, a corresponding **private key** (`.pem` file) is generated. This private key is required to generate an access token and cannot be retrieved again later — so be sure to download and store it securely. The app will prompt you to save it as `<key-id>.pem`.

- **Access Tokens**  
  - Generate tokens using your stored `.pem` file and selected scopes.  
  - Scopes are specified as a space-separated string, e.g.:
    ```
    data:read data:write
    ```
  - Use the `Copy Token` button to copy the `access_token` value to your clipboard.  
  - You can also open the token in [jwt.io](https://jwt.io) to inspect its claims.

---

## 🧰 Requirements

- An APS Developer Account
- SSA feature access (currently available via beta/private access)
- Browser with JavaScript enabled

---

## 📦 Installation (Local)

This tool is frontend-only and can be hosted locally or on any static hosting service.

```bash
git clone https://github.com/autodesk-developer-network/ssa-manager.git
cd ssa-manager
# Open index.html in your browser or serve with any static server
