export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    });
}

export async function sleepUntil(date: Date): Promise<void> {
    const now = new Date();
    if (now < date) {
        const diff = +(date) - +(now);
        console.log(`Sleeping for ${diff} ms`);
        await sleep(diff);
    }
}
