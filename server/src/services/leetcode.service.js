// Talks to LeetCode's public GraphQL endpoint on the server side.
// LeetCode does not allow this to be called directly from a browser (CORS),
// so the Express API acts as the proxy: the client calls us, we call
// LeetCode, and we reshape the response into something the UI can render.

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

const PROFILE_QUERY = `
  query userProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        realName
        userAvatar
        ranking
        reputation
        starRating
        aboutMe
        school
        countryName
        company
      }
      submitStats {
        acSubmissionNum {
          difficulty
          count
        }
        totalSubmissionNum {
          difficulty
          count
        }
      }
      badges {
        displayName
        icon
      }
    }
    userContestRanking(username: $username) {
      attendedContestsCount
      rating
      globalRanking
      topPercentage
    }
  }
`;

export class LeetCodeNotFoundError extends Error {}
export class LeetCodeUpstreamError extends Error {}

async function fetchRawProfile(username) {
  const response = await fetch(LEETCODE_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // LeetCode expects a same-site-looking referer, otherwise it can
      // reject the request even though the data is public.
      Referer: `https://leetcode.com/${username}/`,
      "User-Agent": "Mozilla/5.0 (compatible; Scoutboard/1.0)"
    },
    body: JSON.stringify({
      query: PROFILE_QUERY,
      variables: { username },
      operationName: "userProfile"
    })
  });

  if (!response.ok) {
    throw new LeetCodeUpstreamError(`LeetCode responded with status ${response.status}`);
  }

  const json = await response.json();

  if (json.errors && json.errors.length > 0) {
    throw new LeetCodeUpstreamError(json.errors[0].message || "LeetCode GraphQL error");
  }

  return json.data;
}

function shapeProfile(data) {
  const matchedUser = data?.matchedUser;
  if (!matchedUser) return null;

  const acStats = matchedUser.submitStats?.acSubmissionNum || [];
  const totalStats = matchedUser.submitStats?.totalSubmissionNum || [];

  const byDifficulty = {};
  ["Easy", "Medium", "Hard", "All"].forEach((level) => {
    const solved = acStats.find((s) => s.difficulty === level)?.count ?? 0;
    const total = totalStats.find((s) => s.difficulty === level)?.count ?? 0;
    byDifficulty[level.toLowerCase()] = { solved, total };
  });

  const contest = data?.userContestRanking;

  return {
    username: matchedUser.username,
    realName: matchedUser.profile?.realName || "",
    avatar: matchedUser.profile?.userAvatar || null,
    ranking: matchedUser.profile?.ranking ?? null,
    reputation: matchedUser.profile?.reputation ?? 0,
    starRating: matchedUser.profile?.starRating ?? 0,
    aboutMe: matchedUser.profile?.aboutMe || "",
    school: matchedUser.profile?.school || "",
    country: matchedUser.profile?.countryName || "",
    company: matchedUser.profile?.company || "",
    badges: (matchedUser.badges || []).map((b) => ({
      name: b.displayName,
      icon: b.icon
    })),
    solved: byDifficulty,
    contest: contest
      ? {
          rating: Math.round(contest.rating || 0),
          attended: contest.attendedContestsCount || 0,
          globalRanking: contest.globalRanking || null,
          topPercentage: contest.topPercentage || null
        }
      : null,
    fetchedAt: new Date().toISOString()
  };
}

/**
 * Fetch and normalize a LeetCode profile by username.
 * Throws LeetCodeNotFoundError if the account doesn't exist,
 * LeetCodeUpstreamError if LeetCode itself failed.
 */
export async function getLeetCodeProfile(username) {
  const data = await fetchRawProfile(username);
  const profile = shapeProfile(data);

  if (!profile) {
    throw new LeetCodeNotFoundError(`No LeetCode account found for "${username}".`);
  }

  return profile;
}
