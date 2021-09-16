"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterPlugin = void 0;
const identity_1 = require("jolocom-lib/js/identity/identity");
const DID_METHOD_PREFIX = 'twit';
const BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAAIMkQQAAAAAApnTcxadxKH%2Bt9ukznI3HNb%2Fom5U%3DcGA5J7z5tzjGTMzfxqTJte4DXlzpgZrSjJwU5ZzYd15lltZl3X";
const TWEET_API = "https://api.twitter.com/1.1/statuses/show.json?id=";
class TwitterPlugin {
    didToTweetInfo(did) {
        const split = did.split(':');
        const screenName = split[2];
        const tweetId = split[3];
        return {
            tweetUrl: `https://twitter.com/${screenName}/status/${tweetId}`,
            tweetId,
            screenName
        };
    }
    async resolve(didOrTweetUrl) {
        let did, tweetId;
        if (didOrTweetUrl.startsWith(`did:${DID_METHOD_PREFIX}`)) {
            did = didOrTweetUrl;
            tweetId = this.didToTweetInfo(did).tweetId;
        }
        else if (didOrTweetUrl.startsWith('http')) {
            const tweetSplit = didOrTweetUrl.split('/');
            const idx = tweetSplit.findIndex(s => s == 'status') + 1;
            if (idx == 0)
                throw new Error('invalid tweet url: ' + didOrTweetUrl);
            tweetId = tweetSplit[idx].split('?')[0];
        }
        else {
            throw new Error('invalid did or twitter URL');
        }
        // pull tweet
        const tweetRes = await this.http._fetch(`${TWEET_API}${tweetId}`, {
            headers: {
                // @ts-ignore
                Authorization: `Bearer ${BEARER_TOKEN}`
            }
        });
        const tweetJson = JSON.parse(await tweetRes.text());
        const alsoKnownAs = [tweetJson.text];
        const twitterUser = tweetJson.user.screen_name;
        return identity_1.Identity.fromJSON({
            didDocument: {
                '@context': [],
                id: `did:${DID_METHOD_PREFIX}:${twitterUser}:${tweetId}`,
                // @ts-ignore
                alsoKnownAs
            }
        });
    }
    async register(sdk) {
        this.http = sdk.transports.http;
        sdk.didMethods.register(DID_METHOD_PREFIX, {
            prefix: DID_METHOD_PREFIX,
            resolver: {
                prefix: 'twit',
                resolve: this.resolve.bind(this)
            },
            // @ts-ignore
            registrar: {}
        });
    }
}
exports.TwitterPlugin = TwitterPlugin;
//# sourceMappingURL=twitter.js.map