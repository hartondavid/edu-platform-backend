import { Router } from "express";
import db from "../utils/database.mjs";
import { sendJsonResponse } from "../utils/utilFunctions.mjs";
import { userAuthMiddleware } from "../utils/middlewares/userAuthMiddleware.mjs";

const router = Router();


// Adaugă o clasă nouă 
router.post('/addClass', userAuthMiddleware, async (req, res) => {

    try {

        const { name } = req.body;

        const userId = req.user.id;

        if (!name) {
            return sendJsonResponse(res, false, 400, "Numele clasei este obligatoriu!", []);
        }

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 3)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }


        const classExists = await (await db.getKnex())('classes').where({ name }).first();
        if (classExists) {
            return sendJsonResponse(res, false, 400, "Clasa există deja!", []);
        }
        const result = await (await db.getKnex())('classes').insert({ name, admin_id: userId }).returning('id');

        // Handle different database return formats
        const id = Array.isArray(result) ? result[0].id : result.id;

        const foundClass = await (await db.getKnex())('classes').where({ id }).first();
        return sendJsonResponse(res, true, 201, "Clasa a fost adăugată cu succes!", { foundClass });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la adăugarea clasei!", { details: error.message });
    }
});

// Actualizează o clasă
router.put('/updateClass/:classId', userAuthMiddleware, async (req, res) => {

    try {

        const { classId } = req.params;
        const { name, subject_id } = req.body;
        const userId = req.user.id;

        if (!name || !subject_id) {
            return sendJsonResponse(res, false, 400, "Nume si materie sunt obligatorii!", []);
        }

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 3)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const foundClass = await (await db.getKnex())('classes').where({ id: classId }).first();

        if (!foundClass) return sendJsonResponse(res, false, 404, "Clasa nu există!", []);

        await (await db.getKnex())('classes').where({ id: classId }).update({
            name: name || foundClass.name,
            subject_id: subject_id || foundClass.subject_id
        });
        const updatedClass = await (await db.getKnex())('classes').where({ id: classId }).first();
        return sendJsonResponse(res, true, 200, "Clasa a fost actualizată cu succes!", { updatedClass });
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la actualizarea clasei!", { details: error.message });
    }
});

// Șterge o clasă
router.delete('/deleteClass/:classId', userAuthMiddleware, async (req, res) => {
    try {

        const { classId } = req.params;

        const userId = req.user.id;

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 3)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const foundClass = await (await db.getKnex())('classes').where({ id: classId }).first();
        if (!foundClass) return sendJsonResponse(res, false, 404, "Clasa nu există!", []);
        await (await db.getKnex())('classes').where({ id: classId }).del();
        return sendJsonResponse(res, true, 200, "Clasa a fost ștersă cu succes!", []);
    } catch (error) {
        return sendJsonResponse(res, false, 500, "Eroare la ștergerea clasei!", { details: error.message });
    }
});

// Obține o clasă după id
router.get('/getClassById/:classId', userAuthMiddleware, async (req, res) => {

    try {

        const { classId } = req.params;
        const userId = req.user.id;

        const userRights = await (await db.getKnex())('user_rights')
            .join('rights', 'user_rights.right_id', 'rights.id')
            .where('rights.right_code', 3)
            .where('user_rights.user_id', userId)
            .first();

        if (!userRights) {
            return sendJsonResponse(res, false, 403, "Nu sunteti autorizat!", []);
        }

        const foundClass = await (await db.getKnex())('classes')
            .where('classes.id', classId)
            .select(
                'classes.id',
                'classes.name',

            )
            .first();
        if (!foundClass) {
            return sendJsonResponse(res, false, 404, 'Clasa nu există!', []);
        }
        return sendJsonResponse(res, true, 200, 'Clasa a fost găsită!', foundClass);
    } catch (error) {
        return sendJsonResponse(res, false, 500, 'Eroare la preluarea clasei!', { details: error.message });
    }
});


router.get('/getAllClasses', userAuthMiddleware, async (req, res) => {

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

        const classes = await (await db.getKnex())('classes').select('*')

        console.log('classes', classes);


        if (!classes) {
            return sendJsonResponse(res, false, 404, 'Clasa nu există!', []);
        }
        return sendJsonResponse(res, true, 200, 'Clasa a fost găsită!', classes);
    } catch (error) {
        return sendJsonResponse(res, false, 500, 'Eroare la preluarea claselor!', { details: error.message });
    }
});


export default router; 