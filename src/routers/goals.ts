import express from "express";
import {
  createGoal,
  deleteGoalById,
  getGoalsByUserId,
  updateGoalById,
} from "../lib/goals.js";
import {
  badRequest,
  internalServerError,
  unprocessableEntity,
} from "../lib/responses.js";
import { AuthenticatedSession, Goal } from "../lib/types.js";
import { AuthenticationMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/", AuthenticationMiddleware, async (request, response) => {
  const { userId } = request.session as AuthenticatedSession;
  const { description } = request.body;

  if (!description) {
    return unprocessableEntity(
      response,
      "description",
      "A description is required.",
    );
  }

  const goalId = await createGoal(Number.parseInt(userId), description);

  if (!goalId) {
    return internalServerError(response, "Error creating goal.");
  }

  return response.status(201).json(true);
});

router.get("/", AuthenticationMiddleware, async (request, response) => {
  const { userId } = request.session as AuthenticatedSession;
  const goals = await getGoalsByUserId(Number.parseInt(userId));

  return response.json(goals);
});

router.put(
  "/:id(\\d+)",
  AuthenticationMiddleware,
  async (request, response) => {
    const { userId } = request.session as AuthenticatedSession;
    const goalId = Number.parseInt(request.params.id);
    const { description, accomplished } = request.body as UpdateGoalBody;
    const updates: Partial<Goal> = {};

    if (description !== undefined) {
      if (description) {
        updates.description = description;
      } else {
        return unprocessableEntity(
          response,
          "description",
          "A description is required.",
        );
      }
    }

    if (accomplished !== undefined) {
      if (typeof accomplished === "boolean") {
        updates.accomplished = accomplished;
      } else {
        return unprocessableEntity(
          response,
          "accomplished",
          "Accomplished must be a boolean.",
        );
      }
    }

    if (!Object.keys(updates).length) {
      return badRequest(response, "No updates were provided.");
    }

    const updated = await updateGoalById(
      goalId,
      Number.parseInt(userId),
      updates,
    );

    if (!updated) {
      return internalServerError(response, "Error updating goal.");
    }

    return response.json(true);
  },
);

router.delete(
  "/:id(\\d+)",
  AuthenticationMiddleware,
  async (request, response) => {
    const { userId } = request.session as AuthenticatedSession;
    const goalId = Number.parseInt(request.params.id);
    const deleted = await deleteGoalById(goalId, Number.parseInt(userId));

    if (!deleted) {
      return internalServerError(response, "Error deleting goal.");
    }

    return response.json(true);
  },
);

export default router;

// Local types

type UpdateGoalBody = Partial<Pick<Goal, "description" | "accomplished">>;
