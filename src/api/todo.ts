import { Router, Request } from 'express';
import { RowDataPacket } from 'mysql2';
import { v4 } from 'uuid';

interface ToDo extends RowDataPacket {
  id: string;
  todo: string;
}

const router = Router();
export default router;

router.get('/', async function(req, res) {
  const [todos] = await req.mysqlPool.query<ToDo[]>("SELECT * FROM `todos`");
  res.status(200).json(todos);
});

interface ToDoInput {
  todo: string;
}

router.post('/', async function(req, res) {
  let id = v4();

  // TODO: Content-Type validation
  // TODO: Request body validation
  let input = req.body as ToDoInput;

  await req.mysqlPool.execute("INSERT INTO `todos` (id, todo) VALUES(?, ?)", [id, input.todo]);

  res.status(201).json({id, todo: input.todo});
});

router.get('/:id', async function(req: Request<{ id: string }>, res) {
  const id = req.params.id;
  const [todos] = await req.mysqlPool.query<ToDo[]>("SELECT * FROM `todos` WHERE `id` = ?", [id]);
  const todo = todos[0];
  if (todo) {
    res.status(200).json(todo);
  } else {
    res.status(404).json({error: 'todo_not_found'});
  }
});

