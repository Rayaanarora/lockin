import { Composition } from "remotion";
import { Video } from "./Video";

export const Root = () => {
  return (
    <>
      <Composition
        id="LockinLaunchFilm"
        component={Video}
        durationInFrames={1050} // 35 seconds @ 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          musicEnabled: true,
        }}
      />
      <Composition
        id="LockinLaunchFilmSplit"
        component={Video}
        durationInFrames={1050}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          musicEnabled: false,
        }}
      />
    </>
  );
};
