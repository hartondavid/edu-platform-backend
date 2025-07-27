/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('users').del()
  await knex('users').insert([
    {
      name: 'David', email: 'david@gmail.com', password: 'e302c093809151cc23e32ac93e775765',
      confirm_password: 'e302c093809151cc23e32ac93e775765', phone: '07254345'
    },
    {
      name: 'Alex', email: 'alex@gmail.com', password: '0bf4375c81978b29d0f546a1e9cd6412',
      confirm_password: '0bf4375c81978b29d0f546a1e9cd6412', phone: '0745123457'
    },
    {
      name: 'Admin', email: 'admin@gmail.com', password: 'f6fdffe48c908deb0f4c3bd36c032e72',
      confirm_password: 'f6fdffe48c908deb0f4c3bd36c032e72', phone: '0745183457'
    },
  ]);
};
