const express = require("express");
const fs = require("fs").promises; // Use promises-based API for fs
const app = express();
const port = process.env.PORT || 3000;
const usersPath = './db.json';

app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.listen(port, () => {
  console.log("Starting node.js at port " + port);
});

// Helper to load users from JSON file
async function loadUsers() {
  const data = await fs.readFile(usersPath, 'utf8');
  return JSON.parse(data);
}

// Helper to save users to JSON file
async function saveUsers(users) {
  await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
}

// Validation middleware function
function validateRequestBody(req, res, next) {
  const { firstname, lastname } = req.body;
  if (!firstname || typeof firstname !== 'string' || firstname.trim() === '') {
    return res.status(400).send("Firstname is required and must be a non-empty string.");
  }
  if (!lastname || typeof lastname !== 'string' || lastname.trim() === '') {
    return res.status(400).send("Lastname is required and must be a non-empty string.");
  }
  next(); // Proceed if validation passes
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

// Search users by name
app.get('/users/search', async (req, res) => {
  const { name } = req.query;
  if (!name) {
      return res.status(400).send('Name query parameter is required');
  }
  const users = await loadUsers();
  const matchingUsers = users.filter(user =>
      user.firstname.toLowerCase().includes(name.toLowerCase()) ||
      user.lastname.toLowerCase().includes(name.toLowerCase())
  );
  if (matchingUsers.length === 0) {
      return res.status(404).send('No users found with the given name');
  }
  res.json(matchingUsers);
});

//Read
app.get('/users', async (req, res) => {
  const users = await loadUsers();
  res.json(users);
});

app.get('/users/:id', async (req, res) => {
    const userID = parseInt(req.params.id);
    const users = await loadUsers();
    const user = users.find(user => user.id === userID);
    if (!user){
        return res.status(404).send('User not found');
    }
    res.json(user);
})

//Create
app.post('/users', validateRequestBody, async (req, res) => {
  const users = await loadUsers();
  const {firstname, lastname} = req.body;
  const newUser = { id: users[users.length-1].id+1, firstname, lastname};
  users.push(newUser);
  await saveUsers(users);
  res.status(201).json(newUser);
})

//Update
app.put('/users/:id', validateRequestBody, async (req, res) => {
  const userID = parseInt(req.params.id);
  const users = await loadUsers();
  const userIndex = users.findIndex(user => user.id === userID);
  if (userIndex === -1){
    return res.status(404).send('User not found');
  }
  const {firstname, lastname} = req.body;
  users[userIndex] = {...users[userIndex], firstname, lastname};
  await saveUsers(users);
  res.json(users[userIndex]).send();
});

//Delete
app.delete('/users/:id', async (req, res) => {
  const userID = parseInt(req.params.id);
  let users = await loadUsers();
  const index = users.findIndex(user => user.id === userID);
  if (index === -1) {
      return res.status(404).send('User not found');
  }
  users.splice(index, 1); // Remove the user from the array
  await saveUsers(users);
  res.status(204).send();
});