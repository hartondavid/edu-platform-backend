import { Router } from "express";
import users from '../endpoints/users.mjs'
import rights from '../endpoints/rights.mjs'
import classes from '../endpoints/classes.mjs'
import classStudents from '../endpoints/classStudents.mjs'
import subjects from '../endpoints/subjects.mjs'
import grades from '../endpoints/grades.mjs'
import assignments from '../endpoints/assignments.mjs'
import classTeachers from '../endpoints/classTeachers.mjs'

const router = Router();

router.use('/users/', users)
router.use('/rights/', rights)
router.use('/classes/', classes)
router.use('/classStudents/', classStudents)
router.use('/subjects/', subjects)
router.use('/grades/', grades)
router.use('/assignments/', assignments)
router.use('/classTeachers/', classTeachers)

export default router;

