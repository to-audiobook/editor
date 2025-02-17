'use strict'


class UndoSplitInfo
{
	Divs = [];
	Line = null;

	constructor(div, line)
	{
		this.Divs.push(div);
		this.Line = {
			Text: line.Text,
			Name: line.Name,
			Emotion: line['Emotion'],
			HeSaid: line['HeSaid']
		};
	}
};



class Editor
{
	_data = null;
	_divLines = null;
	_datalistName = null;
	_names = new Set();
	_modified = false;
	_fileName = null;
	_textareaSelected = null;
	_undoSplitStack = [];
	

	static BeforeUnloadCallback(event)
    {    	
    	event.preventDefault();        
        event.returnValue = true;
    }
    
	
    constructor()
    {
        var self = this;
        document.getElementById('buttonInputFile').addEventListener(
        	'change', 
            function(event)
	        {
	            self.MenuLoadClicked(event);
	        });

        document.getElementById('menuSave').addEventListener(
        	'click', 
            function(event)
	        {
	            self.MenuSaveClicked(event);
	        });

        document.getElementById('menuSplit').addEventListener(
        	'click', 
            function(event)
	        {
	            self.MenuSplitClicked(event);
	        });

	    document.getElementById('menuUndoSplit').addEventListener(
	       	'click', 
	        function(event)
	        {
	            self.MenuUndoSplitClicked(event);
	        });

        this._divLines = document.getElementById('divLines');

        this._datalistName = this.CreateElement(document.body, 'datalist');
       	this._datalistName.id = 'datalistName';
		this.ResetDatalistName();
    }


    MenuLoadClicked(event)
    {
        this.LoadJSON(event.target.files[0]);
    }


    MenuSaveClicked(event)
    {
        this.SaveJSON();
    }


    MenuSplitClicked(event)
    {
        this.SplitSelectedText();
    }


    MenuUndoSplitClicked(event)
    {
        this.UndoSplitSelectedText();
    }


    CreateElement(parent, tagName, className = null, text = null)
    {
        var e = document.createElement(tagName);

        e.className = className;

        if(text)
        {
            const content = document.createTextNode(text);
            e.appendChild(content);
        }

		if(parent !== null)
		{
        	parent.appendChild(e);
        }

        return e;
    }


    CreateElementOption(parent, text)
    {
    	var o = this.CreateElement(parent, 'option');
    	o.innerHTML = text;
    	o.value = text;
    }



    async ReadFile(file) {
        let result = await new Promise((resolve) => {
            let fileReader = new FileReader();
            fileReader.onload = (e) => resolve(fileReader.result);
            fileReader.readAsText(file);
        });   
    
        return result;
    }


    SetModified(wasModified)
    {		    
    	if(wasModified)
    	{		    
	        
	    	this._modified = true;
	    	window.addEventListener("beforeunload", Editor.BeforeUnloadCallback);
    	}
    	else
    	{
    		this._modified = false;
    		window.removeEventListener("beforeunload", Editor.BeforeUnloadCallback);
    	}
    }
    


    AddName(text)
    {
    	if(!this._names.has(text))
    	{
    		this._names.add(text);
    		this.CreateElementOption(this._datalistName, text);
    	}
    }


    ResetDatalistName()
    {
    	this._datalistName.textContent = '';
    	this._names.clear();
    	this.AddName('Narrator');
    }


	CreateLineDiv(line, previousDiv)
	{
	
    	self = this;

    	function SetModifiedCallback(e)
    	{	
    		self.SetModified(true);
    	}
    	    	
    	function AddNameCallback(e)
    	{	
    		const name = e.target.value;
    		e.target.parentElement.parentElement.LineInfo.Line.Name = name;
    		self.AddName(name);
    		self.SetModified(true);
    	}

    	function SetEmotionCallback(e)
    	{
    		const emotion = e.target.value;
    		e.target.parentElement.parentElement.LineInfo.Line.Emotion = emotion;
    		self.SetModified(true);
    	}

    	function SetHeSaidCallback(e)
    	{
    		const checked = e.target.checked;
    		e.target.parentElement.parentElement.parentElement.LineInfo.Line.HeSaid = checked;
    		self.SetModified(true);
    	}

    	function SetSelectedTextareaCallback(e)
    	{
    		self._textareaSelected = e.target;
    	}
	
    	
        var div = this.CreateElement(null, 'div', 'lineContainer');                

        var divText = this.CreateElement(div, 'div', 'linePropertyContainer');

        var textAreaText = this.CreateElement(divText, 'textarea', 'lineText');
        textAreaText.cols = 80;
        textAreaText.rows = 1;
        textAreaText.value = line.Text;
        textAreaText.readOnly = true;
        textAreaText.tabIndex = "-1";
        textAreaText.style.height = 'auto';
        //textAreaText.Line = line;
        textAreaText.addEventListener('click', SetSelectedTextareaCallback);

        var divProps = this.CreateElement(div, 'div', 'linePropertyContainer');
       
        var labelName = this.CreateElement(divProps, 'label', 'lineLabel');
        labelName.textContent = 'Name:';
        var inputName = this.CreateElement(divProps, 'input', 'lineName');
        inputName.type = "text";
        inputName.setAttribute('list', this._datalistName.id);
        inputName.addEventListener('blur', AddNameCallback);
        inputName.addEventListener('input', SetModifiedCallback);
        inputName.value = line.Name !== '???' ? line.Name : '';
        //inputName.Line = line;

		// empty elements just to give some space between the "name"
		// and the other property. Competent web designers probably
		// do not need this sort of hack
		this.CreateElement(divProps, 'label', 'lineLabel');
		this.CreateElement(divProps, 'label', 'lineLabel');

        var labelEmotion = this.CreateElement(divProps, 'label', 'lineLabel');
        labelEmotion.textContent = 'Emotion:';
        var selectEmotion = this.CreateElement(divProps, 'select', 'lineEmotion');
        this.CreateElementOption(selectEmotion, 'none');
        this.CreateElementOption(selectEmotion, 'angry');
        this.CreateElementOption(selectEmotion, 'excited');
        this.CreateElementOption(selectEmotion, 'sad');
        selectEmotion.addEventListener('change', SetEmotionCallback);
        selectEmotion.value = line.Emotion ? line.Emotion : 'none';
        //selectEmotion.Line = line;

		// more empty elements for spacing
		this.CreateElement(divProps, 'label', 'lineLabel');			                
        
       	var labelheSaid = this.CreateElement(divProps, 'label', 'lineLabelHeSaid');
       	labelheSaid.textContent = 'He said';
       	var inputHeSaid = this.CreateElement(labelheSaid, 'input', 'lineHeSaid');
       	inputHeSaid.type = "checkbox";
       	inputHeSaid.addEventListener('click', SetHeSaidCallback);
       	inputHeSaid.checked = line.HeSaid ? line.HeSaid : false;
       	//inputHeSaid.Line = line;

		if(previousDiv === null)
		{
        	this._divLines.appendChild(div);
        }
        else
        {
        	previousDiv.insertAdjacentElement('afterend', div);
        }

        // must be done after the textArea is visible, which will only
        // happen after it is added to the body
        textAreaText.style.height = 'auto';
        if(textAreaText.scrollHeight > textAreaText.clientHeight)
        {
        	textAreaText.style.height = textAreaText.scrollHeight + 'px';
        }

        div.LineInfo = {
        	Elements: {
        		TextareaText: textAreaText,
        		InputName: inputName,
        		SelectEmotion: selectEmotion,
        		InputHeSaid: inputHeSaid        		
        	},
        	Line: line
        };

        return div;
	}


    LoadJSON(file)
    {   
    	// clean up
		this._data = null;		
		this._textareaSelected = null;
		this._undoSplitStack.length = 0;
    
    	this._fileName = file.name;
    
    	// remove all children elements
    	this._divLines.textContent = '';

		// clear previously entered names in order to avoid polluting the list
    	this.ResetDatalistName();
    	this.SetModified(false);

    	// load the file
        const text = this.ReadFile(file).then(text => {
            this._data = JSON.parse(text);

            for(const line of this._data)
            {
            	this.CreateLineDiv(line, null);                
            }
        });
    }


    SaveJSON()
    {
    	if(this._fileName === null)
    	{
    		return;
    	}
    	
		const a = document.createElement("a");
      	a.href = URL.createObjectURL(
      		new Blob(
      			[JSON.stringify(this._data, null, 4)], 
      			{
        			type: "application/json"
      			}
      		)
      	);      	
      	a.setAttribute("download", this._fileName);

      	document.body.appendChild(a);
      	a.click();
      	document.body.removeChild(a);

      	this.SetModified(false);
    }


    AddUndoSplitInfo(usi)
    {    	
    	this._undoSplitStack.push(usi);
    }


    ShowNoTextSelectedError()
    {
    	alert('You must select the text you want to split');
    }


    FlashElement(e)
    {
    	const classStart = 'lineFlash';
    	const classEnd = 'lineFlashEnd';
    	const delay = 1050;
    	
    	e.classList.add(classStart);
    	setTimeout(function()
    	{
    		e.classList.remove(classStart);
    		e.classList.add(classEnd);
    		setTimeout(function()
    		{
    			e.classList.remove(classEnd);
    		},delay);
    	}, delay);
    }


    SplitSelectedText()
    {
    	if(!this._textareaSelected)
		{
			this.ShowNoTextSelectedError();
			return;
		}

		const selectedDiv = this._textareaSelected.parentElement.parentElement
		
		var line = selectedDiv.LineInfo.Line;
	
		var pEnd = this._textareaSelected.selectionStart - 1;
		var textBefore = line.Text.substr(0, pEnd);

		var p = pEnd + 1;
		pEnd = this._textareaSelected.selectionEnd;
		var textSelected = line.Text.substr(p, pEnd - p);

		if(!textSelected)
		{
			this.ShowNoTextSelectedError();
			return;
		}

		var textAfter = line.Text.substr(pEnd);

		// alert('before: "' + textBefore + '"\n\n' + 'sel: "' + textSelected + '"\n\nafter: "' + textAfter + '"');
		;

		const usi = new UndoSplitInfo(selectedDiv, line);

		if(!textBefore)
		{
			textBefore = textSelected;
			textSelected = textAfter;
			textAfter = null;
		}
   	    		
   	    line.Text = textBefore;
   	    this._textareaSelected.value = textBefore;

   	    const lineSelected = {
   	    	Text: textSelected,
   	    	Name: '' 
   	    };

		const index = this._data.indexOf(line);
   	    this._data.splice(index + 1, 0, lineSelected);

   	    var divSelected = this.CreateLineDiv(
   	    	lineSelected, 
   	    	this._textareaSelected.parentElement.parentElement);

   	    usi.Divs.push(divSelected);

		if(textAfter)
		{
	   	    const lineAfter = {
	   	    	Text: textAfter,
	   	    	Name: '' 
	   		};
	   	    
	   	    this._data.splice(index + 2, 0, lineAfter);

	   	    const divAfter = this.CreateLineDiv(lineAfter, divSelected);

	   	    usi.Divs.push(divAfter);
	   	}

	   	this.AddUndoSplitInfo(usi);

	   	for(var e of usi.Divs)
	   	{
	   		this.FlashElement(e);
	   	}
    }


    UndoSplitSelectedText()
    {
    	if(this._undoSplitStack.length === 0)
    	{
    		alert('nothing to undo');
    		return;
    	}

    	const usi = this._undoSplitStack.pop();
    	
    	while(usi.Divs.length > 1)
    	{
    		var div = usi.Divs.pop();
    		div.remove();
    	}

    	var li = usi.Divs[0].LineInfo;
    	li.Line.Text = usi.Line.Text;
    	li.Elements.TextareaText.value = usi.Line.Text;
    	li.Elements.InputName.value = usi.Line.Name;

    	if(usi.Line.Emotion)
    	{
    		li.Elements.SelectEmotion = usi.Line.Emotion;
    	}

    	if(usi.Line.HeSaid)
    	{
    		li.Elements.InputHeSaid.checked = usi.Line.HeSaid;
    	}
    }
}


window.onload = function(e){ 
    var editor = new Editor();
}

