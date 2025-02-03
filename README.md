I created a little json editor to help us out. Hopefully it should make things way faster than using a general purpose text editor.

https://to-audiobook.github.io/editor/index.html

It is a small web application. When the editor is running, just click on `Load`, select a `json` and it will render it on your screen.

The main feature this specialized editor has is that it will remember the names you've already typed. Just press the first letters and a list of names should appear. Then you can select the name, or type a new one, and press `TAB` to move to the next field / line. The whole idea was to allow us to work without having to use the mouse. Once you get the hang of it, your productivity will soar! Or not. I hope it will.

Another great feature is that it will parse the json text and show the lines on the screen the way we are supposed to see them. Meaning, you won't see those `\u00a0` or `\n`or anything like that anymore. 

I also took the opportunity to add two new fields

1. Emotion: you probably can skip this, but if you happen to notice that a character should be feeling something when saying a line, for instance, he was sad, then you can select `sad` and the system will make the voice sound sad.
2. "He said": this was the best name my super-intelligent brain was able to come-up with for those sentences where the narrator interrupts a dialog only to say "he said." If you flag those cases using that check box I can then filter out those when generating the audio.

**Do not forget to save when you are done!** There is a 'Save' button on the top of screen that you should use for that. It will reconvert everything you are seeing on the screen to a json file you can then upload to the proper repository.

Please let me know if anything is not working properly. Text is too small? Too big? Did not like the color? Feel free to suggest anything.
