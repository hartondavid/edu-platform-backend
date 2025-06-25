
exports.up = function (knex) {
    return knex.schema.createTable('subject_teachers', function (table) {
        table.increments('id').primary();
        table.integer('subject_id').unsigned().notNullable()
            .references('id').inTable('subjects').onDelete('CASCADE');
        table.integer('teacher_id').unsigned().notNullable()
            .references('id').inTable('users').onDelete('CASCADE');

        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('subject_teachers');
};
