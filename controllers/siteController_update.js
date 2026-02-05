
// ============ LABOUR ATTENDANCE UPDATE ============

const updateLabourAttendance = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;
        const userId = req.user.userId;

        const attendance = await LabourAttendance.findById(id);
        if (!attendance) {
            return res.status(404).json({ success: false, error: 'Attendance record not found' });
        }

        // Get labour to adjust payout
        const labour = await Labour.findById(attendance.labourId);
        if (labour) {
            // Revert old payout
            let oldPayout = 0;
            if (attendance.status === 'present') oldPayout = labour.dailyWage;
            else if (attendance.status === 'half') oldPayout = labour.dailyWage / 2;

            // Calculate new payout
            let newPayout = 0;
            if (status === 'present') newPayout = labour.dailyWage;
            else if (status === 'half') newPayout = labour.dailyWage / 2;

            const adjustment = newPayout - oldPayout;

            if (adjustment !== 0) {
                await Labour.findByIdAndUpdate(attendance.labourId, { $inc: { pendingPayout: adjustment } });
            }
        }

        // Update record
        attendance.status = status;
        if (remarks !== undefined) attendance.remarks = remarks;
        await attendance.save();

        res.json({ success: true, message: 'Attendance updated successfully', data: attendance });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    updateLabourAttendance
};
