/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('user_rights').del()
  await knex('user_rights').insert([
    { user_id: 1, right_id: 1 },
    { user_id: 2, right_id: 2 },
    { user_id: 3, right_id: 3 },
  ]);

  // Reset the sequence to start from the next available ID
  await knex.raw('SELECT setval(\'user_rights_id_seq\', (SELECT MAX(id) FROM user_rights))');
};
