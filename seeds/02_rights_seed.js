/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('rights').del()
  await knex('rights').insert([
    { id: 1, name: 'teacher', right_code: 1 },
    { id: 2, name: 'student', right_code: 2 },
    { id: 3, name: 'admin', right_code: 3 }
  ]);

  // Reset the sequence to start from the next available ID
  await knex.raw('SELECT setval(\'rights_id_seq\', (SELECT MAX(id) FROM rights))');
};
