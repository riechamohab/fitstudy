async function loadUsers(){

    const response = await fetch(
        "http://localhost:3000/api/admin/users",
        {
            credentials: "include"
        }
    );

    console.log("Status:", response.status);

    const users = await response.json();

    console.log("API antwoord:", users);

    if (!Array.isArray(users)) {
        document.getElementById("userCount").innerText = "Geen toegang";
        return;
    }

    document.getElementById("userCount").innerText = users.length;

    const table = document.getElementById("userTable");

    table.innerHTML = "";

    users.forEach(user => {
        table.innerHTML += `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            </tr>
        `;
    });
}

loadUsers();