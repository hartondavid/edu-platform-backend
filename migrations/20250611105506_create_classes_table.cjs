
exports.up = function (knex) {
    return knex.schema.createTable('classes', function (table) {
        table.increments('id').primary();
        table.string('name', 255).notNullable();
        table.integer('subject_id').unsigned().notNullable()
            .references('id').inTable('subjects').onDelete('CASCADE');
        table.integer('teacher_id').unsigned().notNullable()
            .references('id').inTable('users').onDelete('CASCADE');
        table.integer('admin_id').unsigned().notNullable()
            .references('id').inTable('users').onDelete('CASCADE');



        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('classes');
};
