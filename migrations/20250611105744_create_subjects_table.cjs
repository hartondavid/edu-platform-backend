
exports.up = function (knex) {
    return knex.schema.createTable('subjects', function (table) {
        table.increments('id').primary();
        table.string('subject', 255).notNullable();
        table.integer('admin_id').unsigned().notNullable()
            .references('id').inTable('users').onDelete('CASCADE');

        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('subjects');
};
