import { Router } from "express";
import db from "../utils/database.mjs";
import { sendJsonResponse } from "../utils/utilFunctions.mjs";
import { userAuthMiddleware } from "../utils/middlewares/userAuthMiddleware.mjs";

const router = Router();

// Adaugă un subiect nou
router.post('/addSubject', userAuthMiddleware, async (req, res) => {

    try {

        const { subject } = req.body;
        const userId = req.user.id;

        if (!subject) {
            return sendJsonResponse(res, false, 400, "Subiectul este obligatoriu!", []);
        }

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 3)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const subjectExists = await (await db.getKnex())('subjects').where({ subject }).first();
        if (subjectExists) {
            return sendJsonResponse(res, false, 400, "Subiectul există deja!", []);
        }

        const result = await (await db.getKnex())('subjects').insert({
            subject, admin_id: userId,
        }).returning('id');
        const id = Array.isArray(result) ? result[0].id : result.id;

        const foundSubject = await (await db.getKnex())('subjects').where({ id }).first();
        return sendJsonResponse(res, true, 201, "Subiectul a fost adăugat cu succes!", { subject: foundSubject });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la adăugarea subiectului!", { details: error.message });
    }
});

// Actualizează un subiect
router.put('/updateSubject/:subjectId', userAuthMiddleware, async (req, res) => {

    try {

        const { subjectId } = req.params;
        const { subject } = req.body;

        if (!subjectId || !subject) {
            return sendJsonResponse(res, false, 400, "Id-ul subiectului si subiectul sunt obligatorii!", []);
        }

        const userId = req.user.id;

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 3)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const foundSubject = await (await db.getKnex())('subjects').where({ id: subjectId }).first();
        if (!foundSubject) return sendJsonResponse(res, false, 404, "Subiectul nu există!", []);

        await (await db.getKnex())('subjects').where({ id: subjectId }).update({
            subject: subject || foundSubject.subject
        });
        const updated = await (await db.getKnex())('subjects').where({ id: subjectId }).first();
        return sendJsonResponse(res, true, 200, "Subiectul a fost actualizat cu succes!", { subject: updated });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la actualizarea subiectului!", { details: error.message });
    }
});


// Șterge un subiect
router.delete('/deleteSubject/:subjectId', userAuthMiddleware, async (req, res) => {

    try {

        const { subjectId } = req.params;
        const userId = req.user.id;

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 3)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const subject = await (await db.getKnex())('subjects').where({ id: subjectId }).first();
        if (!subject) return sendJsonResponse(res, false, 404, "Subiectul nu există!", []);
        await (await db.getKnex())('subjects').where({ id: subjectId }).del();
        return sendJsonResponse(res, true, 200, "Subiectul a fost șters cu succes!", []);
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la ștergerea subiectului!", { details: error.message });
    }
});

// Obține un subiect după id
router.get('/getSubject/:subjectId', userAuthMiddleware, async (req, res) => {

    try {

        const { subjectId } = req.params;

        const userId = req.user.id;

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 3)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const subject = await (await db.getKnex())('subjects')
            .where('id', subjectId)
            .select(
                'subjects.id',
                'subjects.subject',
                'subjects.admin_id',

            )
            .first();
        if (!subject) {
            return sendJsonResponse(res, false, 404, 'Subiectul nu există!', []);
        }
        return sendJsonResponse(res, true, 200, 'Subiectul a fost găsit!', subject);
    } catch (error) {
        return sendJsonResponse(res, false, 500, 'Eroare la preluarea subiectului!', { details: error.message });
    }
});


router.get('/getSubjects', userAuthMiddleware, async (req, res) => {

    try {
        const userId = req.user.id;

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 3)
            .orWhere('rights.right_code', 1)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const subjects = await (await db.getKnex())('subjects').select(
            'subjects.id',
            'subjects.subject',
            'subjects.admin_id',
            'subjects.created_at',
        );

        const results = await Promise.all(subjects.map(async subject => {
            // Get order items for this order
            const teachers = await (await db.getKnex())('subject_teachers')
                .join('users', 'subject_teachers.teacher_id', 'users.id')
                .where('subject_teachers.subject_id', subject.id)
                .select(
                    'users.id',
                    'users.name',
                    'users.email',
                    'users.phone',
                    'users.photo',
                );
            return {
                ...subject,
                teachers: teachers
            };
        }));


        if (!results) {
            return sendJsonResponse(res, false, 404, 'Subiectul nu există!', []);
        }
        return sendJsonResponse(res, true, 200, 'Subiectele au fost găsite!', results);
    } catch (error) {
        return sendJsonResponse(res, false, 500, 'Eroare la preluarea subiectelor!', { details: error.message });
    }
});


router.get('/getSubjectsByStudentId', userAuthMiddleware, async (req, res) => {

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

        const subjects = await (await db.getKnex())('subjects')
            .join('classes', 'subjects.class_id', 'classes.id')
            .join('class_students', 'classes.id', 'class_students.class_id')
            .join('teachers', 'classes.teacher_id', 'teachers.id')
            .where('class_students.student_id', userId)
            .select(
                'subjects.id',
                'subjects.name as subject_name',
                'classes.name as class_name',
                'teachers.name as teacher_name',
            );


        if (!subjects) {
            return sendJsonResponse(res, false, 404, 'Subiectul nu există!', []);
        }
        return sendJsonResponse(res, true, 200, 'Subiectele au fost găsite!', subjects);
    } catch (error) {
        return sendJsonResponse(res, false, 500, 'Eroare la preluarea subiectelor!', { details: error.message });
    }
});

router.get('/searchSubject', userAuthMiddleware, async (req, res) => {
    const { searchField } = req.query;

    if (!searchField) {
        return sendJsonResponse(res, false, 400, 'Search field is required', null);
    }

    try {
        // Query the database to search for employees where name contains the searchField
        const subjects = await (await db.getKnex())('subjects')
            .join('user_rights', 'subjects.id', 'user_rights.user_id')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 1)
            .where(function () {
                this.where('subjects.subject', 'like', `%${searchField}%`)
            })
            .select('subjects.*');


        if (subjects.length === 0) {
            return sendJsonResponse(res, false, 404, 'Nu există subiecte!', []);
        }

        // Attach the employees to the request object for the next middleware or route handler
        return sendJsonResponse(res, true, 200, 'Subiectele au fost găsiți!', subjects);
    } catch (err) {
        console.error(err);
        return sendJsonResponse(res, false, 500, 'An error occurred while retrieving subjects', null);
    }
})

router.post('/addSubjectTeacher/:subjectId', userAuthMiddleware, async (req, res) => {

    try {

        const { subjectId } = req.params;
        const { teacher_id } = req.body;
        const userId = req.user.id;

        if (!subjectId || !teacher_id) {
            return sendJsonResponse(res, false, 400, "Subiectul si profesorul sunt obligatorii!", []);
        }

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 3)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const [id] = await (await db.getKnex())('subject_teachers').insert({
            subject_id: subjectId, teacher_id: teacher_id,
        });

        const subjectTeacher = await (await db.getKnex())('subject_teachers').where({ id }).first();
        return sendJsonResponse(res, true, 201, "Profesorul a fost adăugat cu succes!", { subjectTeacher });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la adăugarea profesorului!", { details: error.message });
    }
});

router.delete('/deleteSubjectTeacher/:subjectTeacherId', userAuthMiddleware, async (req, res) => {

    try {

        const { subjectTeacherId } = req.params;

        const userId = req.user.id;

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 3)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        console.log('subjectTeacherId', subjectTeacherId);

        const subjectTeacher = await (await db.getKnex())('subject_teachers').where({ id: subjectTeacherId }).first();
        if (!subjectTeacher) return sendJsonResponse(res, false, 404, "Profesorul nu există!", []);
        await (await db.getKnex())('subject_teachers').where({ id: subjectTeacherId }).del();
        return sendJsonResponse(res, true, 200, "Profesorul a fost șters cu succes!", []);
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la ștergerea profesorului!", { details: error.message });
    }
});


router.get('/getSubjectTeachersBySubjectId/:subjectId', userAuthMiddleware, async (req, res) => {

    try {

        const userId = req.user.id;

        const { subjectId } = req.params;

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 3)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }
        console.log('subjectId', subjectId);

        const subjectTeachers = await (await db.getKnex())('subject_teachers')
            .join('users', 'subject_teachers.teacher_id', 'users.id')
            .where('subject_teachers.subject_id', subjectId)
            .select(
                'subject_teachers.teacher_id as id',
                'subject_teachers.subject_id',
                'users.name',
                'users.email',
                'users.phone',
            )

        console.log('subjectTeachers', subjectTeachers);


        if (!subjectTeachers) {
            return sendJsonResponse(res, false, 404, 'Profesorii nu există!', []);
        }
        return sendJsonResponse(res, true, 200, 'Profesorii au fost găsiți!', subjectTeachers);
    } catch (error) {
        return sendJsonResponse(res, false, 500, 'Eroare la preluarea profesorilor!', { details: error.message });
    }
});


router.get('/getSubjectsByTeacherId', userAuthMiddleware, async (req, res) => {

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

        const subjects = await (await db.getKnex())('subjects')
            .join('subject_teachers', 'subjects.id', 'subject_teachers.subject_id')
            .where('subject_teachers.teacher_id', userId)
            .select(
                'subjects.id',
                'subjects.subject',
                'subjects.created_at',
            );


        if (!subjects) {
            return sendJsonResponse(res, false, 404, 'Subiectul nu există!', []);
        }
        return sendJsonResponse(res, true, 200, 'Subiectele au fost găsite!', subjects);
    } catch (error) {
        return sendJsonResponse(res, false, 500, 'Eroare la preluarea subiectelor!', { details: error.message });
    }
});


export default router; 