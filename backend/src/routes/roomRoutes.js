import express from 'express';
import { createRoomController, getRoomController, listRoomsController } from '../controllers/roomController.js';

const router = express.Router();

router.post('/', createRoomController);
router.get('/', listRoomsController);
router.get('/:roomCode', getRoomController);

export default router;
