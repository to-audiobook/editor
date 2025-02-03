'use strict'


class Editor
{
	_data = null;
	_divLines = null;
	_datalistName = null;
	_names = new Set();
	_modified = false;
	_fileName = null;

	static BeforeUnloadCallback(event)
    {    	
    	event.preventDefault();        
        event.returnValue = true;
    }
    
	
    constructor()
    {
        var self = this;
        document.getElementById('buttonInputFile').addEventListener('change', 
            function(event)
        {
            self.MenuLoadClicked(event);
        });

        document.getElementById('menuSave').addEventListener('click', 
            function(event)
        {
            self.MenuSaveClicked(event);
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


    LoadJSON(file)
    {    
    	// callback that adds the newly input name to the set of names
    	self = this;

    	function SetModifiedCallback(e)
    	{	
    		self.SetModified(true);
    	}
    	    	
    	function AddNameCallback(e)
    	{	
    		const name = e.target.value;
    		e.target.Line.Name = name;
    		self.AddName(name);
    		self.SetModified(true);
    	}

    	function SetEmotionCallback(e)
    	{
    		const emotion = e.target.value;
    		e.target.Line.Emotion = emotion;
    		self.SetModified(true);
    	}

    	function SetHeSaidCallback(e)
    	{
    		const checked = e.target.value === 'on';
    		e.target.Line.HeSaid = checked;
    		self.SetModified(true);
    	}

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
                var div = this.CreateElement(null, 'div', 'lineContainer');                

                var divText = this.CreateElement(div, 'div', 'linePropertyContainer');

                var textAreaText = this.CreateElement(divText, 'textarea', 'lineText');
                textAreaText.cols = 80;
                textAreaText.value = line.Text;
                textAreaText.readOnly = true;
                textAreaText.tabIndex = "-1";
                textAreaText.style.height = 'auto';
                textAreaText.Line = line;

                var divProps = this.CreateElement(div, 'div', 'linePropertyContainer');
               
                var labelName = this.CreateElement(divProps, 'label', 'lineLabel');
                labelName.textContent = 'Name:';
                var inputName = this.CreateElement(divProps, 'input', 'lineName');
                inputName.type = "text";
                inputName.setAttribute('list', this._datalistName.id);
                inputName.addEventListener('blur', AddNameCallback);
                inputName.addEventListener('input', SetModifiedCallback);
                inputName.value = line.Name !== '???' ? line.Name : '';
                inputName.Line = line;


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
                selectEmotion.Line = line;

				// more empty elements for spacing
				this.CreateElement(divProps, 'label', 'lineLabel');			                
                
               	var labelheSaid = this.CreateElement(divProps, 'label', 'lineLabelHeSaid');
               	labelheSaid.textContent = 'He said';
               	var inputHeSaid = this.CreateElement(labelheSaid, 'input', 'lineHeSaid');
               	inputHeSaid.type = "checkbox";
               	inputHeSaid.addEventListener('click', SetHeSaidCallback);
               	inputHeSaid.checked = line.HeSaid ? line.HeSaid : false;
               	inputHeSaid.Line = line;

                this._divLines.appendChild(div);

                // must be done after the textArea is visible, which will only
                // happen after it is added to the body
                textAreaText.style.height = textAreaText.scrollHeight + 'px';
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
}


window.onload = function(e){ 
    var editor = new Editor();
}

