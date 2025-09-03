import { Inngest } from "inngest";

export const inngest = new Inngest({
    id: "SkillHub",
    name: "SkillHub",
    credentials: {
        gemini: {
            apiKey: process.env.GEMINI_API_KEY,
        },
    },
});
