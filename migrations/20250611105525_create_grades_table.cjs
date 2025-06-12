
exports.up = function (knex) {
    return knex.schema.createTable('grades', function (table) {
        table.increments('id').primary();
        table.integer('grade').notNullable();
        table.integer('student_id').unsigned().notNullable()
            .references('id').inTable('users').onDelete('CASCADE');
        table.integer('subject_id').unsigned().notNullable()
            .references('id').inTable('users').onDelete('CASCADE');

        table.integer('teacher_id').unsigned().notNullable()
            .references('id').inTable('users').onDelete('CASCADE');

        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('grades');
};
