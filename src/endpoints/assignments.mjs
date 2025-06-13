import { Router } from "express";
import db from "../utils/database.mjs";
import { sendJsonResponse } from "../utils/utilFunctions.mjs";
import { userAuthMiddleware } from "../utils/middlewares/userAuthMiddleware.mjs";
import createMulter from "../utils/uploadUtils.mjs";

const upload = createMulter('public/uploads/assignments', [
    'image/jpeg', 'image/png', 'image/gif', 'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'application/zip', 'application/x-rar-compressed', 'application/octet-stream'
]);

const router = Router();


// Adaugă o rețetă nouă (doar admin)
router.post('/addAssignment', userAuthMiddleware, upload.fields([{ name: 'file' }]), async (req, res) => {

    try {


        const userId = req.user?.id;
        const { student_id, subject_id, assignment } = req.body;

        if (!student_id || !subject_id) {
            return sendJsonResponse(res, false, 400, "Elevul și materia nu există!", []);
        }


        if (!req.files || !req.files['file']) {
            return sendJsonResponse(res, false, 400, "File is required", null);
        }

        let filePathForImagePath = req.files['file'][0].path; // Get the full file path
        filePathForImagePath = filePathForImagePath.replace(/^public[\\/]/, '');

        const userRights = await db('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 1)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }


        const [id] = await db('assignments').insert({
            file_path: filePathForImagePath, student_id: student_id,
            subject_id: subject_id, teacher_id: userId, assignment
        });


        const foundAssignment = await db('assignments').where({ id }).first();
        return sendJsonResponse(res, true, 201, "Tema a fost adăugată cu succes!", { foundAssignment });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la adăugarea temei!", { details: error.message });
    }
});


// //Șterge o rezervare
router.delete('/deleteAssignment/:assignmentId', userAuthMiddleware, async (req, res) => {

    try {
        const { assignmentId } = req.params;
        const userId = req.user?.id;

        if (!assignmentId) {
            return sendJsonResponse(res, false, 400, "Tema nu există!", []);
        }

        const userRights = await db('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 1)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const assignment = await db('assignments')
            .where({ id: assignmentId }).first();
        if (!assignment) return sendJsonResponse(res, false, 404, "Tema nu există!", []);
        await db('assignments').where({ id: assignmentId }).del();
        return sendJsonResponse(res, true, 200, "Tema a fost ștearsă cu succes!", []);
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la ștergerea temei!", { details: error.message });
    }
});

router.get('/getAssignmentsByStudentIdByTeacherId', userAuthMiddleware, async (req, res) => {
    try {

        const userId = req.user?.id;

        const userRights = await db('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 1)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const students = await db('users')
            .join('class_students', 'users.id', 'class_students.student_id')
            .join('classes', 'class_students.class_id', 'classes.id')
            .where('classes.teacher_id', userId)
            .select(
                'users.id',
                'users.name',
                'users.photo',
                'users.phone',
                'users.email',
                'users.created_at',
                'classes.name as class_name',

            )
            .orderBy('users.name', 'asc')
            .groupBy('users.id');


        const results = await Promise.all(students.map(async student => {
            // Get order items for this order
            const assignments = await db('assignments')
                .join('subjects', 'assignments.subject_id', 'subjects.id')
                .where('assignments.student_id', student.id)
                .where('assignments.teacher_id', userId)
                .select(
                    'assignments.id',
                    'assignments.student_id',
                    'assignments.file_path',
                    'subjects.subject',
                    'assignments.created_at',
                    'assignments.assignment'
                );
            return {
                ...student,
                assignments: assignments
            };
        }));


        if (results.length === 0) {
            return sendJsonResponse(res, false, 404, 'Nu există teme!', []);
        }
        return sendJsonResponse(res, true, 200, 'Teme a fost găsite!', results);
    } catch (error) {
        return sendJsonResponse(res, false, 500, 'Eroare la preluarea temelor!', { details: error.message });
    }
});

router.get('/getAssignmentsBySubjectIdByStudentId', userAuthMiddleware, async (req, res) => {
    try {

        const userId = req.user?.id;

        const userRights = await db('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 2)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const subjects = await db('subjects')
            .join('assignments', 'subjects.id', 'assignments.subject_id')
            .where('assignments.student_id', userId)
            .select(
                'subjects.id',
                'subjects.subject',
                'subjects.created_at',

            )
            .orderBy('subjects.subject', 'asc')
            .groupBy('subjects.id');


        const results = await Promise.all(subjects.map(async subject => {
            // Get order items for this order
            const assignments = await db('assignments')
                .join('subjects', 'assignments.subject_id', 'subjects.id')
                .where('assignments.subject_id', subject.id)
                .where('assignments.student_id', userId)
                .select(
                    'assignments.id',
                    'assignments.student_id',
                    'assignments.file_path',
                    'subjects.subject',
                    'assignments.created_at',
                    'assignments.assignment'
                );
            return {
                ...subject,
                assignments: assignments
            };
        }));


        if (results.length === 0) {
            return sendJsonResponse(res, false, 404, 'Nu există teme!', []);
        }
        return sendJsonResponse(res, true, 200, 'Teme a fost găsite!', results);
    } catch (error) {
        return sendJsonResponse(res, false, 500, 'Eroare la preluarea temelor!', { details: error.message });
    }
});


export default router;
