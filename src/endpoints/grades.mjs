import { Router } from "express";
import db from "../utils/database.mjs";
import { sendJsonResponse } from "../utils/utilFunctions.mjs";
import { userAuthMiddleware } from "../utils/middlewares/userAuthMiddleware.mjs";

const router = Router();

// Adaugă o notă nouă (doar admin)
router.post('/addGrade/:studentId', userAuthMiddleware, async (req, res) => {

    try {

        const { studentId } = req.params;
        const { subject_id, grade } = req.body;
        const userId = req.user.id;

        const userRights = await db('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 1)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const [id] = await db('grades').insert({
            student_id: studentId, subject_id: subject_id, grade: grade, teacher_id: userId,
        });

        const foundGrade = await db('grades').where({ id }).first();
        return sendJsonResponse(res, true, 201, "Elevul a fost adăugat cu succes!", { grade: foundGrade });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la adăugarea notei!", { details: error.message });
    }
});

// Actualizează o notă
router.put('/updateGrade/:gradeId', userAuthMiddleware, async (req, res) => {

    try {

        const { gradeId } = req.params;
        const { student_id, grade, subject_id } = req.body;

        console.log('gradeId ', gradeId);
        console.log('student_id ', student_id);
        console.log('grade ', grade);

        const userId = req.user.id;

        const userRights = await db('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 1)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const foundGrade = await db('grades').where({ id: gradeId }).first();
        if (!foundGrade) return sendJsonResponse(res, false, 404, "Elevul nu există!", []);

        await db('grades').where({ id: gradeId }).update({
            student_id: student_id || foundGrade.student_id,
            grade: grade || foundGrade.grade,
            subject_id: subject_id || foundGrade.subject_id
        });
        const updated = await db('grades').where({ id: gradeId }).first();
        return sendJsonResponse(res, true, 200, "Elevul a fost actualizat cu succes!", { grade: updated });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la actualizarea elevului!", { details: error.message });
    }
});


// Șterge o notă
router.delete('/deleteGrade/:gradeId/:studentId/:subjectId', userAuthMiddleware, async (req, res) => {

    try {

        const { gradeId, studentId, subjectId } = req.params;


        const userId = req.user.id;

        const userRights = await db('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 1)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const foundGrade = await db('grades').where({ id: gradeId, student_id: studentId, subject_id: subjectId }).first();
        if (!foundGrade) return sendJsonResponse(res, false, 404, "Elevul nu există!", []);
        await db('grades').where({ id: gradeId, student_id: studentId, subject_id: subjectId }).del();
        return sendJsonResponse(res, true, 200, "Elevul a fost șters cu succes!", []);
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la ștergerea notei!", { details: error.message });
    }
});

// Obține o notă după id
// router.get('/getGrade/:gradeId', userAuthMiddleware, async (req, res) => {

//     try {

//         const { gradeId } = req.params;

//         const userId = req.user.id;

//         const userRights = await db('user_rights')
//             .join('rights', 'user_rights.right_id', 'rights.id')
//             .where('rights.right_code', 1)
//             .where('user_rights.user_id', userId)
//             .first();

//         if (!userRights) {
//             return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
//         }

//         const foundGrade = await db('grades')
//             .join('students', 'grades.student_id', 'students.id')
//             .where('grades.id', gradeId)
//             .select(
//                 'grades.id',
//                 'grades.student_id',
//                 'grades.class_id',
//                 'classes.name'
//             )
//             .first();
//         if (!classStudent) {
//             return sendJsonResponse(res, false, 404, 'Elevul nu există!', []);
//         }
//         return sendJsonResponse(res, true, 200, 'Elevul a fost găsit!', classStudent);
//     } catch (error) {
//         return sendJsonResponse(res, false, 500, 'Eroare la preluarea elevului!', { details: error.message });
//     }
// });



router.get('/getGradesByStudentIdByTeacherId', userAuthMiddleware, async (req, res) => {

    try {

        const userId = req.user.id;

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
                'users.name ',
                'users.email',
                'users.phone',
                'classes.name as class_name',
                'users.created_at',
            )
            .groupBy('classes.id');



        const results = await Promise.all(students.map(async student => {
            // Get order items for this order
            const grades = await db('grades')
                .join('subjects', 'grades.subject_id', 'subjects.id')
                .where('grades.student_id', student.id)
                .select(
                    'grades.id',
                    'grades.student_id',
                    'grades.grade',
                    'subjects.subject',
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

        const userRights = await db('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 2)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const subjects = await db('class_students')
            .join('classes', 'class_students.class_id', 'classes.id')
            .join('subjects', 'classes.subject_id', 'subjects.id')
            .where('class_students.student_id', userId)
            .select(
                'subjects.id',
                'subjects.name',
                'classes.name',
                'classes.created_at',

            )
            .groupBy('classes.id');



        const results = await Promise.all(subjects.map(async subject => {
            // Get order items for this order
            const grades = await db('grades')
                .join('students', 'grades.student_id', 'students.id')
                .join('classes', 'students.class_id', 'classes.id')
                .join('class_students', 'classes.id', 'class_students.class_id')
                .join('subjects', 'class_students.subject_id', 'subjects.id')
                .select(
                    'grades.id',
                    'grades.student_id',
                    'grades.class_id',
                    'grades.grade',
                    'students.name',
                    'students.email',
                    'students.phone',
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

router.get('/getGradesByStudentId/:studentId', userAuthMiddleware, async (req, res) => {

    try {

        const userId = req.user.id;

        const { studentId } = req.params;

        const userRights = await db('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 1)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const grades = await db('grades')
            .join('users', 'grades.student_id', 'users.id')
            .join('classes', 'users.class_id', 'classes.id')
            .join('subjects', 'grades.subject_id', 'subjects.id')
            .where('grades.teacher_id', userId)
            .where('grades.student_id', studentId)
            .select(
                'grades.id',
                'grades.student_id',
                'grades.class_id',
                'grades.grade',
                'classes.name',
                'subjects.name',
            )

        console.log('classStudents', classStudents);


        if (!grades) {
            return sendJsonResponse(res, false, 404, 'Notele nu există!', []);
        }
        return sendJsonResponse(res, true, 200, 'Notele au fost găsiți!', grades);
    } catch (error) {
        return sendJsonResponse(res, false, 500, 'Eroare la preluarea notelor!', { details: error.message });
    }
});



// router.get('/getIngredientsByCakeId/:cakeId', userAuthMiddleware, async (req, res) => {
//     try {
//         const { cakeId } = req.params;

//         const userId = req.user.id;

//         const userRights = await db('user_rights')
//             .join('rights', 'user_rights.right_id', 'rights.id')
//             .where('rights.right_code', 1)
//             .where('user_rights.user_id', userId)
//             .first();

//         if (!userRights) {
//             return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
//         }

//         const ingredients = await db('cake_ingredients')
//             .join('ingredients', 'cake_ingredients.ingredient_id', 'ingredients.id')
//             .where('cake_ingredients.cake_id', cakeId)
//             .select(
//                 'cake_ingredients.id',
//                 'cake_ingredients.ingredient_id',
//                 'cake_ingredients.quantity',
//                 'ingredients.name',
//                 'cake_ingredients.created_at',
//             )
//         if (ingredients.length === 0) {
//             return sendJsonResponse(res, false, 404, 'Nu există ingredientele!', []);
//         }
//         return sendJsonResponse(res, true, 200, 'Ingredientele a fost găsite!', ingredients);
//     } catch (error) {
//         return sendJsonResponse(res, false, 500, 'Eroare la preluarea ingredientelor!', { details: error.message });
//     }
// });




export default router; 