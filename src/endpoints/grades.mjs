import { Router } from "express";
import db from "../utils/database.mjs";
import { sendJsonResponse } from "../utils/utilFunctions.mjs";
import { userAuthMiddleware } from "../utils/middlewares/userAuthMiddleware.mjs";

const router = Router();

// Adaugă o notă nouă 
router.post('/addGrade/:studentId', userAuthMiddleware, async (req, res) => {

    try {

        const { studentId } = req.params;
        const { subject_id, grade } = req.body;
        const userId = req.user.id;

        if (!studentId || !subject_id || !grade) {
            return sendJsonResponse(res, false, 400, "Studentul, nota si materia sunt obligatorii!", []);
        }

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 1)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const result = await (await db.getKnex())('grades').insert({
            student_id: studentId, subject_id: subject_id, grade: grade, teacher_id: userId,
        }).returning('id');
        const id = Array.isArray(result) ? result[0].id : result.id;

        const foundGrade = await (await db.getKnex())('grades').where({ id }).first();
        return sendJsonResponse(res, true, 201, "Elevul a fost adăugat cu succes!", { grade: foundGrade });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la adăugarea notei!", { details: error.message });
    }
});

// Actualizează o notă
router.put('/updateGrade/:gradeId', userAuthMiddleware, async (req, res) => {

    try {

        const { gradeId } = req.params;
        const { grade } = req.body;

        const userId = req.user.id;

        if (!gradeId || !grade) {
            return sendJsonResponse(res, false, 400, "Id-ul notei si nota sunt obligatorii!", []);
        }

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 1)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const foundGrade = await (await db.getKnex())('grades').where({ id: gradeId }).first();
        if (!foundGrade) return sendJsonResponse(res, false, 404, "Elevul nu există!", []);

        await (await db.getKnex())('grades').where({ id: gradeId }).update({
            grade: grade || foundGrade.grade,
        });
        const updated = await (await db.getKnex())('grades').where({ id: gradeId }).first();
        return sendJsonResponse(res, true, 200, "Elevul a fost actualizat cu succes!", { grade: updated });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la actualizarea elevului!", { details: error.message });
    }
});


// Șterge o notă
router.delete('/deleteGrade/:gradeId', userAuthMiddleware, async (req, res) => {

    try {

        const { gradeId } = req.params;


        const userId = req.user.id;

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 1)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const foundGrade = await (await db.getKnex())('grades').where({ id: gradeId }).first();
        if (!foundGrade) return sendJsonResponse(res, false, 404, "Elevul nu există!", []);
        await (await db.getKnex())('grades').where({ id: gradeId }).del();
        return sendJsonResponse(res, true, 200, "Elevul a fost șters cu succes!", []);
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la ștergerea notei!", { details: error.message });
    }
});


router.get('/getGradesByStudentIdByClassId/:classId', userAuthMiddleware, async (req, res) => {

    try {

        const userId = req.user.id;

        const { classId } = req.params;

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 1)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const students = await (await db.getKnex())('users')
            .join('class_students', 'users.id', 'class_students.student_id')
            .join('classes', 'class_students.class_id', 'classes.id')
            .join('class_teachers', 'classes.id', 'class_teachers.class_id')
            .where('class_students.class_id', classId)
            .where('class_teachers.teacher_id', userId)
            .select(
                'users.id',
                'users.name',
                'users.email',
                'users.phone',
                'classes.name as class_name',
                'users.created_at',
                'users.photo',
                'classes.id as class_id'
            )
            .orderBy('users.name', 'asc')
            .groupBy('users.id', 'users.name', 'users.email', 'users.phone', 'classes.name', 'users.created_at', 'users.photo', 'classes.id');



        const results = await Promise.all(students.map(async student => {
            // Get order items for this order
            const grades = await (await db.getKnex())('grades')
                .join('subjects', 'grades.subject_id', 'subjects.id')
                .where('grades.student_id', student.id)
                .select(
                    'grades.id',
                    'grades.student_id',
                    'grades.grade',
                    'subjects.subject',
                    'grades.created_at',
                );
            return {
                ...student,
                grades: grades
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


router.get('/getGradesBySubjectIdByStudentId', userAuthMiddleware, async (req, res) => {

    try {

        const userId = req.user.id;

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 2)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const subjects = await (await db.getKnex())('grades')
            .join('users', 'grades.student_id', 'users.id')
            .join('subjects', 'grades.subject_id', 'subjects.id')
            .where('grades.student_id', userId)
            .select(
                'subjects.id',
                'subjects.subject',
                'subjects.created_at',

            )
            .groupBy('subjects.id');

        console.log('subjects', subjects);


        const results = await Promise.all(subjects.map(async subject => {
            // Get order items for this order
            const grades = await (await db.getKnex())('grades')
                .join('users', 'grades.student_id', 'users.id')
                // .join('class_students', 'users.id', 'class_students.student_id')
                .join('subjects', 'grades.subject_id', 'subjects.id')
                .where('grades.subject_id', subject.id)
                .where('grades.student_id', userId)
                .select(
                    'grades.id',
                    'grades.grade',
                    'grades.created_at',
                );
            return {
                ...subject,
                grades: grades
            };
        }));

        if (!results) {
            return sendJsonResponse(res, false, 404, 'Notele nu există!', []);
        }
        return sendJsonResponse(res, true, 200, 'Notele au fost găsiți!', results);
    } catch (error) {
        return sendJsonResponse(res, false, 500, 'Eroare la preluarea notelor!', { details: error.message });
    }
});

export default router; 