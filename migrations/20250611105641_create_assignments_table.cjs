
exports.up = function (knex) {
    return knex.schema.createTable('assignments', function (table) {
        table.increments('id').primary();
        table.string('assignment', 255).notNullable();
        table.text('requirement_file_path').nullable();
        table.text('solution_file_path').nullable();
        table.integer('grade', 255).nullable();

        table.integer('student_id').unsigned().notNullable()
            .references('id').inTable('users').onDelete('CASCADE');
        table.integer('subject_id').unsigned().notNullable()
            .references('id').inTable('subjects').onDelete('CASCADE');

        table.integer('teacher_id').unsigned().notNullable()
            .references('id').inTable('users').onDelete('CASCADE');

        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('assignments');
};
