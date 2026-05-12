# Security Specification for SpinRoulette

## Data Invariants
1. A session must have a list of names and pitched members.
2. Only the `adminId` can modify the session state (spinning, names, stopwatch).
3. A vote can only be cast if the user is authenticated.
4. A user can only vote for the *current* winner of the session.
5. Users cannot modify or delete their votes once cast (locked).
6. AdminId is immutable once the session is created.

## The Dirty Dozen Payloads
1. Trying to spin the wheel as a non-admin.
2. Trying to update `adminId` to steal the session.
3. Trying to vote without being signed in.
4. Trying to vote as another user (spoofing `userId`).
5. Trying to vote twice for the same winner (checked by voteId being `userId_winnerName`).
6. Trying to vote for a winner that isn't the `currentWinner` in the session.
7. Trying to delete the session as a participant.
8. Trying to modify someone else's vote choice.
9. Injecting a massive string into the `names` array.
10. Clearing the session history as a participant.
11. Updating the stopwatch time as a participant.
12. Creating a vote with a field not in the schema (e.g. `isAdmin: true`).

## Test Runner (Draft Logic)
The test runner will verify that:
- `setDoc` on `/sessions/1` succeeds only for the initial creator.
- `update` on `/sessions/1` fails if `request.auth.uid != resource.data.adminId`.
- `setDoc` on `/sessions/1/votes/{uid}` succeeds if `request.auth.uid == uid` and choice is 'buy'/'leave'.
- `update` on `/sessions/1/votes/{uid}` always fails.
