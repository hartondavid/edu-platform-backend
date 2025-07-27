import { Router } from "express";
import db from "../utils/database.mjs";
import { sendJsonResponse } from "../utils/utilFunctions.mjs";
import { userAuthMiddleware } from "../utils/middlewares/userAuthMiddleware.mjs";

const router = Router();

// Adaugă un student la o clasă
router.post('/addClassStudent/:classId', userAuthMiddleware, async (req, res) => {

    try {

        const { classId } = req.params;
        const { student_id } = req.body;
        const userId = req.user.id;

        if (!classId || !student_id) {
            return sendJsonResponse(res, false, 400, "Clasa si elevul sunt obligatorii!", []);
        }

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 3)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const result = await (await db.getKnex())('class_students').insert({
            student_id, class_id: classId, admin_id: userId,
        }).returning('id');
        const id = Array.isArray(result) ? result[0].id : result.id;

        const classStudent = await (await db.getKnex())('class_students').where({ id }).first();
        return sendJsonResponse(res, true, 201, "Elevul a fost adăugat cu succes!", { classStudent });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la adăugarea elevului!", { details: error.message });
    }
});


// Șterge un elev
router.delete('/deleteClassStudent/:studentId', userAuthMiddleware, async (req, res) => {

    try {

        const { studentId } = req.params;

        const userId = req.user.id;

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 3)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        console.log('studentId', studentId);

        const classStudent = await (await db.getKnex())('class_students').where({ student_id: studentId }).first();
        if (!classStudent) return sendJsonResponse(res, false, 404, "Elevul nu există!", []);
        await (await db.getKnex())('class_students').where({ student_id: studentId }).del();
        return sendJsonResponse(res, true, 200, "Elevul a fost șters cu succes!", []);
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la ștergerea elevului!", { details: error.message });
    }
});


router.get('/getClassStudents', userAuthMiddleware, async (req, res) => {

    try {

        const userId = req.user.id;

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 3)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const classes = await (await db.getKnex())('classes')
            .select(
                'classes.id',
                'classes.name as class_name',
                'classes.created_at',

            )
            .groupBy('classes.id');

        console.log('classes', classes);



        const results = await Promise.all(classes.map(async classStudent => {
            // Get order items for this order
            const students = await (await db.getKnex())('users')
                .join('class_students', 'users.id', 'class_students.student_id')
                .join('classes', 'class_students.class_id', 'classes.id')
                .where('class_students.class_id', classStudent.id)
                .select(
                    'users.id',
                    'users.name',
                    'users.email',
                    'users.phone',
                    'users.photo',
                    'users.created_at',
                );
            return {
                ...classStudent,
                students: students
            };
        }));



        if (!results) {
            return sendJsonResponse(res, false, 404, 'Elevii nu există!', []);
        }
        return sendJsonResponse(res, true, 200, 'Elevii au fost găsiți!', results);
    } catch (error) {
        return sendJsonResponse(res, false, 500, 'Eroare la preluarea elevilor!', { details: error.message });
    }
});

router.get('/getClassStudentsByTeacherId', userAuthMiddleware, async (req, res) => {

    try {

        const userId = req.user.id;

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 1)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const classStudents = await (await db.getKnex())('classes')
            .select(
                'classes.id',
                'classes.name as class_name',
                'classes.created_at',

            )
            .groupBy('classes.id');



        const results = await Promise.all(classStudents.map(async classStudent => {
            // Get order items for this order
            const students = await (await db.getKnex())('users')
                .join('class_students', 'users.id', 'class_students.student_id')
                .join('classes', 'class_students.class_id', 'classes.id')
                .where('class_students.class_id', classStudent.id)
                .select(
                    'class_students.id',
                    'class_students.student_id',
                    'users.name',
                    'users.email',
                    'users.phone',
                    'users.photo',
                );
            return {
                ...classStudent,
                students: students
            };
        }));



        if (!results) {
            return sendJsonResponse(res, false, 404, 'Elevii nu există!', []);
        }
        return sendJsonResponse(res, true, 200, 'Elevii au fost găsiți!', results);
    } catch (error) {
        return sendJsonResponse(res, false, 500, 'Eroare la preluarea elevilor!', { details: error.message });
    }
});


router.get('/getClassStudentsByClassId/:classId', userAuthMiddleware, async (req, res) => {

    try {

        const userId = req.user.id;

        const { classId } = req.params;

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 3)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const classStudents = await (await db.getKnex())('class_students')
            .join('classes', 'class_students.class_id', 'classes.id')
            .join('users', 'class_students.student_id', 'users.id')
            .where('class_students.class_id', classId)
            .select(
                'class_students.student_id as id',
                'class_students.class_id',
                'classes.name as class_name',
                'classes.created_at',
                'users.name',
                'users.email',
                'users.phone',
            )

        console.log('classStudents', classStudents);


        if (!classStudents) {
            return sendJsonResponse(res, false, 404, 'Elevii nu există!', []);
        }
        return sendJsonResponse(res, true, 200, 'Elevii au fost găsiți!', classStudents);
    } catch (error) {
        return sendJsonResponse(res, false, 500, 'Eroare la preluarea elevilor!', { details: error.message });
    }
});


export default router; 