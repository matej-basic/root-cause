'use strict';

// Root Cause lab: a small notes API over GraphQL. Two separate issues sit
// side by side here on purpose: introspection is left enabled even though
// the server presents itself as production, and one query resolver skips
// the ownership check the other one has. Neither is a library bug; both
// are choices made in this file.

const fs = require('fs');
const { ApolloServer, gql } = require('apollo-server');

const FLAG_PATH = process.env.FLAG_PATH || '/flag/flag.txt';

// Read the per-run flag the Root Cause flagger wrote to the shared volume.
// This runs once at startup, before the schema and seed data below exist.
// The app never reads the flag again after this; from here on it only
// lives inside the seeded note, same as any other note body.
function readFlag() {
  try {
    const flag = fs.readFileSync(FLAG_PATH, 'utf8').trim();
    if (flag) return flag;
  } catch (err) {
    // No flag file, most likely a local run outside the Root Cause
    // compose stack. Fall back so the app still boots.
  }
  return 'flag{local-dev-placeholder}';
}

const FLAG = readFlag();

// Two accounts: the demo user every request is signed in as by default,
// and an internal account that owns one note nothing in the UI links to.
const users = {
  '0': { id: '0', username: 'admin' },
  '1': { id: '1', username: 'jdoe' },
};

// Seed notes. Note 1 belongs to the internal account and holds the flag
// as its body; the rest belong to the demo user and are what the app's
// own "my notes" query is meant to return.
const notes = [
  { id: '1', title: 'Infra access handover', body: FLAG, ownerId: '0' },
  { id: '101', title: 'Grocery list', body: 'Milk, eggs, bread.', ownerId: '1' },
  { id: '102', title: 'Standup notes', body: 'Ship the notes API by Friday.', ownerId: '1' },
  { id: '103', title: 'Book club', body: 'Pick up Project Hail Mary.', ownerId: '1' },
];

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
  }

  type Note {
    id: ID!
    title: String!
    body: String!
    owner: User!
  }

  type Query {
    "The signed-in user."
    me: User!
    "Notes owned by the signed-in user."
    notes: [Note!]!
    "Fetch a single note by id."
    note(id: ID!): Note
  }
`;

const resolvers = {
  Query: {
    me: (_parent, _args, context) => users[context.userId],
    notes: (_parent, _args, context) =>
      notes.filter((n) => n.ownerId === context.userId),
    // Object-level access flaw: this resolver fetches a note by id alone.
    // Unlike `notes` above, it never checks that the note's ownerId
    // matches the caller's own id, so any id reachable through this
    // field is readable regardless of who owns it.
    note: (_parent, { id }) => notes.find((n) => n.id === id) || null,
  },
  Note: {
    owner: (note) => users[note.ownerId],
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  // Left on in "production": nothing here disables introspection, so the
  // full schema, including fields and arguments no page in the app ever
  // calls, is discoverable by anyone who asks for it.
  introspection: true,
  context: ({ req }) => ({
    // Stand-in for a session. Authentication itself is not this lab's
    // bug, so it is kept to a header rather than a real login flow.
    userId: req.headers['x-user-id'] || '1',
  }),
});

server.listen({ port: 8080 }).then(({ url }) => {
  console.log(`graphql-idor notes API ready at ${url}`);
});
