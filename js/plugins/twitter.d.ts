import { JolocomPlugin, JolocomSDK } from '..';
import { Identity } from "jolocom-lib/js/identity/identity";
import { HTTPTransport } from "src/http";
export declare class TwitterPlugin implements JolocomPlugin {
    http: HTTPTransport;
    didToTweetInfo(did: string): {
        tweetUrl: string;
        tweetId: string;
        screenName: string;
    };
    resolve(didOrTweetUrl: string): Promise<Identity>;
    register(sdk: JolocomSDK): Promise<void>;
}
