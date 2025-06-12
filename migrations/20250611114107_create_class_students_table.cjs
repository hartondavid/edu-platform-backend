
exports.up = function (knex) {
    return knex.schema.createTable('class_students', function (table) {
        table.increments('id').primary();
        table.integer('student_id').unsigned().notNullable()
            .references('id').inTable('users').onDelete('CASCADE');
        table.integer('class_id').unsigned().notNullable()
            .references('id').inTable('classes').onDelete('CASCADE');
        table.integer('admin_id').unsigned().notNullable()
            .references('id').inTable('users').onDelete('CASCADE');

        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('class_students');
};
