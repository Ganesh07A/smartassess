import { clerkClient } from '@clerk/express';
import 'dotenv-safe/config';

const run = async () => {
    try {
        console.log("Checking Clerk API method...");
        await clerkClient.users.updateUserMetadata('user_123_fake', { publicMetadata: { role: 'teacher' } });
        console.log("Success?");
    } catch(err: any) {
        console.log("ERROR IS:", err.message);
    }
}

run();
