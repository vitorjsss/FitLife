import { MealCalendarService } from "../services/MealCalendarService.js";
import { LogService } from "../services/LogService.js";

export const MealCalendarController = {
    getMonthlyProgress: async (req, res) => {
        const { patientId } = req.params;
        const { year, month } = req.query;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            if (!year || !month) {
                return res.status(400).json({ message: "Year and month are required" });
            }

            const progress = await MealCalendarService.getMonthlyProgress(
                patientId,
                parseInt(year),
                parseInt(month)
            );

            await LogService.createLog({
                action: "GET_MONTHLY_MEAL_PROGRESS",
                logType: "READ",
                description: `Monthly meal progress retrieved for patient ${patientId}, ${year}-${month}`,
                ip,
                oldValue: null,
                newValue: { patientId, year, month, daysCount: progress.length },
                status: "SUCCESS",
                userId: userId
            });

            res.json(progress);
        } catch (err) {
            await LogService.createLog({
                action: "GET_MONTHLY_MEAL_PROGRESS",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { patientId, year, month },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Error retrieving monthly progress", error: err });
        }
    },

    getDayDetails: async (req, res) => {
        const { patientId } = req.params;
        const { date } = req.query;
        const ip = req.ip;
        const userId = req.user?.id;

        try {
            if (!date) {
                return res.status(400).json({ message: "Date is required" });
            }

            const details = await MealCalendarService.getDayDetails(patientId, date);

            await LogService.createLog({
                action: "GET_DAY_MEAL_DETAILS",
                logType: "READ",
                description: `Day meal details retrieved for patient ${patientId}, date ${date}`,
                ip,
                oldValue: null,
                newValue: { patientId, date },
                status: "SUCCESS",
                userId: userId
            });

            res.json(details);
        } catch (err) {
            await LogService.createLog({
                action: "GET_DAY_MEAL_DETAILS",
                logType: "ERROR",
                description: err.message,
                ip,
                oldValue: null,
                newValue: { patientId, date },
                status: "FAILURE",
                userId: userId
            });

            res.status(500).json({ message: "Error retrieving day details", error: err });
        }
    }
};
