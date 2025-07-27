import { Router } from "express";
import db from "../utils/database.mjs";
import { sendJsonResponse } from "../utils/utilFunctions.mjs";
import { userAuthMiddleware } from "../utils/middlewares/userAuthMiddleware.mjs";

const router = Router();

// Adaugă un profesor la o clasă 
router.post('/addClassTeacher/:classId', userAuthMiddleware, async (req, res) => {

    try {

        const { classId } = req.params;
        const { teacher_id } = req.body;
        const userId = req.user.id;

        console.log('classId', classId);
        console.log('teacher_id', teacher_id);

        if (!classId || !teacher_id) {
            return sendJsonResponse(res, false, 400, "Clasa si profesorul sunt obligatorii!", []);
        }

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 3)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const result = await (await db.getKnex())('class_teachers').insert({
            teacher_id, class_id: classId, admin_id: userId,
        }).returning('id');
        const id = Array.isArray(result) ? result[0].id : result.id;

        const classTeacher = await (await db.getKnex())('class_teachers').where({ id }).first();
        return sendJsonResponse(res, true, 201, "Profesorul a fost adăugat cu succes!", { classTeacher });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la adăugarea profesorului!", { details: error.message });
    }
});


// Șterge un profesor
router.delete('/deleteClassTeacher/:teacherId', userAuthMiddleware, async (req, res) => {

    try {

        const { teacherId } = req.params;

        const userId = req.user.id;

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 3)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        console.log('teacherId', teacherId);

        const classTeacher = await (await db.getKnex())('class_teachers').where({ teacher_id: teacherId }).first();
        if (!classTeacher) return sendJsonResponse(res, false, 404, "Profesorul nu există!", []);
        await (await db.getKnex())('class_teachers').where({ teacher_id: teacherId }).del();
        return sendJsonResponse(res, true, 200, "Profesorul a fost șters cu succes!", []);
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la ștergerea profesorului!", { details: error.message });
    }
});


router.get('/getClassTeachers', userAuthMiddleware, async (req, res) => {

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

        const classTeachers = await (await db.getKnex())('classes')
            .select(
                'classes.id',
                'classes.name as class_name',
                'classes.created_at',

            )
            .groupBy('classes.id');

        console.log('classTeachers', classTeachers);



        const results = await Promise.all(classTeachers.map(async classTeacher => {
            // Get order items for this order
            const teachers = await (await db.getKnex())('users')
                .join('class_teachers', 'users.id', 'class_teachers.teacher_id')
                .join('classes', 'class_teachers.class_id', 'classes.id')
                .where('class_teachers.class_id', classTeacher.id)
                .select(
                    'class_teachers.id',
                    'users.name',
                    'users.email',
                    'users.phone',
                    'users.photo',
                    'users.created_at',
                );
            return {
                ...classTeacher,
                teachers: teachers
            };
        }));



        if (!results) {
            return sendJsonResponse(res, false, 404, 'Elevii nu există!', []);
        }
        return sendJsonResponse(res, true, 200, 'Profesorii au fost găsiți!', results);
    } catch (error) {
        return sendJsonResponse(res, false, 500, 'Eroare la preluarea profesorilor!', { details: error.message });
    }
});

router.get('/getClassTeachersByTeacherId', userAuthMiddleware, async (req, res) => {

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

        const classTeachers = await (await db.getKnex())('classes')
            .join('users', 'classes.teacher_id', 'users.id')
            .join('subjects', 'classes.subject_id', 'subjects.id')
            .where('classes.teacher_id', userId)
            .select(
                'classes.id',
                'classes.name as class_name',
                'classes.created_at',
                'users.name as teacher_name',
                'subjects.subject as subject_name',
                'users.photo',

            )
            .groupBy('classes.id');



        const results = await Promise.all(classTeachers.map(async classTeacher => {
            // Get order items for this order
            const teachers = await (await db.getKnex())('users')
                .join('class_teachers', 'users.id', 'class_teachers.teacher_id')
                .join('classes', 'class_teachers.class_id', 'classes.id')
                .where('class_teachers.class_id', classTeacher.id)
                .select(
                    'users.id',
                    'class_teachers.id',
                    'class_teachers.teacher_id',
                    'users.name',
                    'users.email',
                    'users.phone',
                    'users.photo',
                );
            return {
                ...classTeacher,
                teachers: teachers
            };
        }));



        if (!results) {
            return sendJsonResponse(res, false, 404, 'Profesorii nu există!', []);
        }
        return sendJsonResponse(res, true, 200, 'Profesorii au fost găsiți!', results);
    } catch (error) {
        return sendJsonResponse(res, false, 500, 'Eroare la preluarea profesorilor!', { details: error.message });
    }
});


router.get('/getClassTeachersByClassId/:classId', userAuthMiddleware, async (req, res) => {

    try {

        const userId = req.user.id;

        const { classId } = req.params;

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 3)
            .orWhere('rights.right_code', 1)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const classTeachers = await (await db.getKnex())('class_teachers')
            .join('users', 'class_teachers.teacher_id', 'users.id')
            .where('class_teachers.class_id', classId)
            .select(
                'class_teachers.teacher_id as id',
                'class_teachers.class_id',
                'users.name',
                'users.email',
                'users.phone',
            )

        console.log('classTeachers', classTeachers);


        if (!classTeachers) {
            return sendJsonResponse(res, false, 404, 'Profesorii nu există!', []);
        }
        return sendJsonResponse(res, true, 200, 'Profesorii au fost găsiți!', classTeachers);
    } catch (error) {
        return sendJsonResponse(res, false, 500, 'Eroare la preluarea profesorilor!', { details: error.message });
    }
});


export default router; 