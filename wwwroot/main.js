const jwt = window.jwt;

let accessToken = null;

// Authentication

function getAccessToken() {
    const clientId = document.getElementById("client-id").value;
    const clientSecret = document.getElementById("client-secret").value;
    const ssaScopes =
        "application:service_account:read application:service_account:write application:service_account_key:read application:service_account_key:write";

    return new Promise(async (resolve, reject) => {
        let res = await fetch(
            "https://developer.api.autodesk.com/authentication/v2/token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials&scope=${ssaScopes}`,
            }
        );

        let data = await res.json();

        resolve(data.access_token);
    });
}
const login = document.getElementById("login");
login.onclick = async () => {
    accessToken = await getAccessToken();

    listAccounts();
};

// Accounts

const accountsList = document.getElementById("accounts-list");

async function listAccounts() {
    const res = await fetch(
        "https://developer.api.autodesk.com/authentication/v2/service-accounts",
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    const data = await res.json();

    accountsList.innerHTML = "";
    data.serviceAccounts.forEach((account) => {
        let option = document.createElement("option");
        option.value = account.serviceAccountId;
        option.text = account.email;
        option.data = account;
        accountsList.appendChild(option);
    });
    accountsList.onchange = () => {
        const accountData =
            accountsList.options[accountsList.selectedIndex].data;
        document.getElementById("account-details").innerHTML = JSON.stringify(
            accountData,
            null,
            2
        );

        listKeys(accountData.serviceAccountId);
    };
}

function addAccount(accountData) {
    let option = document.createElement("option");
    option.value = accountData.serviceAccountId;
    option.text = accountData.email;
    option.data = accountData;
    accountsList.appendChild(option);
}

function updateAccount(status) {
    accountsList.options[accountsList.selectedIndex].data.status = status;

    accountsList.onchange();
}

function removeAccount() {
    accountsList.remove(accountsList.selectedIndex);
}

const createAccount = document.getElementById("create-account");
createAccount.onclick = async () => {
    const firstName = document.getElementById("first-name").value;
    const lastName = document.getElementById("last-name").value;

    try {
        const res = await fetch(
            "https://developer.api.autodesk.com/authentication/v2/service-accounts",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    name: firstName + '_' + lastName,
                    firstName: firstName,
                    lastName: lastName,
                }),
            }
        );

        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        console.log(data);

        addAccount(data);
    } catch (error) {
        alert(error);
    }
};

const enableDisableAccount = document.getElementById("enable-disable-account");
enableDisableAccount.onclick = async () => {
    const accountData = accountsList.options[accountsList.selectedIndex].data;
    const newStatus = accountData.status === "ENABLED" ? "DISABLED" : "ENABLED";

    if (newStatus === "DISABLED") {
        if (!confirm("Are you sure you want to disable the account?")) return;
    }

    try {
        const res = await fetch(
            `https://developer.api.autodesk.com/authentication/v2/service-accounts/${accountData.serviceAccountId}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    status: newStatus,
                }),
            }
        );

        if (!res.ok) throw new Error(await res.text());

        updateAccount(newStatus);
    } catch (error) {
        alert(error);
    }
};

const deleteAccount = document.getElementById("delete-account");
deleteAccount.onclick = async () => {
    if (
        confirm(
            "Are you sure you want to delete the account? \nThis operation is irreversible."
        ) == false
    )
        return;

    try {
        const accountData =
            accountsList.options[accountsList.selectedIndex].data;

        const res = await fetch(
            `https://developer.api.autodesk.com/authentication/v2/service-accounts/${accountData.serviceAccountId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!res.ok) throw new Error(await res.text());

        removeAccount();
    } catch (error) {
        alert(error);
    }
};

// Keys

const keysList = document.getElementById("keys-list");

async function listKeys(accountId) {
    const res = await fetch(
        `https://developer.api.autodesk.com/authentication/v2/service-accounts/${accountId}/keys`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    const data = await res.json();

    keysList.innerHTML = "";
    data.keys.forEach((key) => {
        addKey(key);
    });
    keysList.onchange = () => {
        const keyData = keysList.options[keysList.selectedIndex].data;
        document.getElementById("key-details").innerHTML = JSON.stringify(
            keyData,
            null,
            2
        );

        showPrivateKey(keyData.kid);
    };
}

function addKey(keyData) {
    let option = document.createElement("option");
    option.value = keyData.kid;
    option.text = keyData.kid;
    option.data = keyData;
    keysList.appendChild(option);

    const accountData = accountsList.options[accountsList.selectedIndex].data;
    if (keyData.privateKey)
        accountData[keyData.kid] = { privateKey: keyData.privateKey };
}

function updateKey(status) {
    keysList.options[keysList.selectedIndex].data.status = status;

    keysList.onchange();
}

function removeKey() {
    const keyData = keysList.options[keysList.selectedIndex].data;
    keysList.remove(keysList.selectedIndex);

    const accountData = accountsList.options[accountsList.selectedIndex].data;
    delete accountData[keyData.kid];
}

const createKey = document.getElementById("create-key");
createKey.onclick = async () => {
    const accountData = accountsList.options[accountsList.selectedIndex].data;

    try {
        const res = await fetch(
            `https://developer.api.autodesk.com/authentication/v2/service-accounts/${accountData.serviceAccountId}/keys`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        console.log(data);

        addKey(data);

        savePem(data);
    } catch (error) {
        alert(error);
    }
};

function savePem(data) {
    const blob = new Blob([data.privateKey], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${data.kid}.pem`;
    link.click();
    URL.revokeObjectURL(link.href);
}

const enableDisableKey = document.getElementById("enable-disable-key");
enableDisableKey.onclick = async () => {
    const keyData = keysList.options[keysList.selectedIndex].data;
    const newStatus = keyData.status === "ENABLED" ? "DISABLED" : "ENABLED";

    if (newStatus === "DISABLED") {
        if (!confirm("Are you sure you want to disable the key?")) return;
    }

    try {
        const accountData =
            accountsList.options[accountsList.selectedIndex].data;

        const res = await fetch(
            `https://developer.api.autodesk.com/authentication/v2/service-accounts/${accountData.serviceAccountId}/keys/${keyData.kid}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    status: newStatus,
                }),
            }
        );

        if (!res.ok) throw new Error(await res.text());

        updateKey(newStatus);
    } catch (error) {
        alert(error);
    }
};

const deleteKey = document.getElementById("delete-key");
deleteKey.onclick = async () => {
    if (
        confirm(
            "Are you sure you want to delete the key? \nThis operation is irreversible."
        ) == false
    )
        return;

    try {
        const accountData =
            accountsList.options[accountsList.selectedIndex].data;
        const keyData = keysList.options[keysList.selectedIndex].data;

        const res = await fetch(
            `https://developer.api.autodesk.com/authentication/v2/service-accounts/${accountData.serviceAccountId}/keys/${keyData.kid}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!res.ok) throw new Error(await res.text());

        removeKey();
    } catch (error) {
        alert(error);
    }
};

async function showPrivateKey(kid) {
    const accountData = accountsList.options[accountsList.selectedIndex].data;

    const privateKey = accountData[kid]?.privateKey || "";

    document.getElementById("private-key").value = privateKey;
}

const loadPem = document.getElementById("load-pem");
loadPem.onclick = () => {
    if (keysList.selectedIndex === -1) {
        alert("Please select the key this private key is for.");
        return;
    }

    const fileInput = document.getElementById("file-input");
    fileInput.click();

    fileInput.onchange = function () {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => {
            document.getElementById("private-key").value = reader.result;
            fileInput.value = "";

            const accountData =
                accountsList.options[accountsList.selectedIndex].data;
            const keyData = keysList.options[keysList.selectedIndex].data;
            accountData[keyData.kid] = { privateKey: reader.result };
        };
    };
};

// Tokens

const createToken = document.getElementById("create-token");
createToken.onclick = async () => {
    const accountData = accountsList.options[accountsList.selectedIndex].data;

    const keyData = keysList.options[keysList.selectedIndex].data;

    const privateKey = document.getElementById("private-key").value;

    const clientId = document.getElementById("client-id").value;
    const clientSecret = document.getElementById("client-secret").value;

    const scopes = document.getElementById("scopes").value;

    const payload = {
        kid: keyData.kid,
        privateKey,
        clientId,
        clientSecret,
        accountId: accountData.serviceAccountId,
        scope: scopes,
    };

    try {
        const token = await fetch(`/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!token.ok) throw new Error(await token.text());

        const tokenData = await token.json();

        document.getElementById("access-token").innerHTML = JSON.stringify(
            tokenData,
            null,
            2
        );
    } catch (error) {
        alert(error);
    }
};

const openJwtIo = document.getElementById("open-jwt-io");
openJwtIo.onclick = async () => {
    try {
        const tokenData = JSON.parse(
            document.getElementById("access-token").innerHTML
        );

        const jwtIoUrl = `https://jwt.io/#debugger-io?token=${tokenData.access_token}`;
        window.open(jwtIoUrl);
    } catch {
        alert("Could not find 'access_token' in the 'Access Token' window.");
    }
};

const copyToken = document.getElementById("copy-token");
copyToken.onclick = async () => {
    try {
        const tokenData = JSON.parse(
            document.getElementById("access-token").value
        );

        navigator.clipboard.writeText(tokenData.access_token);
    } catch {
        alert("Could not find 'access_token' in the 'Access Token' window.");
    }
};
