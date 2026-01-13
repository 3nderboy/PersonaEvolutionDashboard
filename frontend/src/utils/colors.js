
export const PERSONA_COLORS = {
    "Decisive Shopper": {
        bg: "bg-green-500",
        text: "text-green-400",
        border: "border-green-500",
        hex: "#22c55e",
        soft: "bg-green-500/20 text-green-300"
    },
    "Explorer": {
        bg: "bg-blue-500",
        text: "text-blue-400",
        border: "border-blue-500",
        hex: "#3b82f6",
        soft: "bg-blue-500/20 text-blue-300"
    },
    "Researcher": {
        bg: "bg-orange-500",
        text: "text-orange-400",
        border: "border-orange-500",
        hex: "#f97316",
        soft: "bg-orange-500/20 text-orange-300"
    },
    "Budget Conscious": {
        bg: "bg-purple-500",
        text: "text-purple-400",
        border: "border-purple-500",
        hex: "#a855f7",
        soft: "bg-purple-500/20 text-purple-300"
    },
    "Methodical": {
        bg: "bg-slate-500",
        text: "text-slate-400",
        border: "border-slate-500",
        hex: "#64748b",
        soft: "bg-slate-500/20 text-slate-300"
    }
};

export const getPersonaColor = (type) => {
    return PERSONA_COLORS[type] || PERSONA_COLORS["Methodical"];
};
