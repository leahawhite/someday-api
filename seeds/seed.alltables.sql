BEGIN;

TRUNCATE notes, users, folders RESTART IDENTITY CASCADE;

INSERT INTO folders (text, icon)
VALUES
  ('Watch', 'film'),
  ('Read', 'book'),
  ('Listen', 'volume-up'),
  ('Eat', 'utensils'),
  ('Do', 'hiking'),
  ('Go', 'road'),
  ('Archives', 'folder');

INSERT INTO users (full_name, email, password)
VALUES
  ('Demo User', 'demo@demo.com', 'demo123');

INSERT INTO notes (what, how, who, link, thoughts, favorite, author, folder)
VALUES
('Los Espookys', 'HBO', 'Me', 'https://www.hbo.com/los-espookys', 'Julio Torres! Looks promising, but the subtitles were quick!', true, 1, 1),
('On Becoming a God in Central Florida', 'Showtime', 'Me', 'https://www.sho.com/on-becoming-a-god-in-central-florida', 'Kirsten Dunst pyramid scheme series', true, 1, 1),
('Fosse/Verdon', 'Hulu', 'Me', 'https://www.fxnetworks.com/shows/fosse-verdon', 'Bob Fosse/Gwen Verdon series with Sam Rockwell and Michelle Williams.', false, 1, 1),
('Schitt''s Creek', 'Netflix', 'Emily', null, 'She''s asked me twice if I have seen this. I should?', true, 1, 1);

COMMIT;