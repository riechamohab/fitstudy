const token = localStorage.getItem("token");


async function loadUsers(){

    const response = await fetch(
        "http://localhost:3001/api/admin/users",
        {
            headers:{
                "Authorization": `Bearer ${token}`
            }
        }
    );


    const users = await response.json();


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