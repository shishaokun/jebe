class JebeController < ApplicationController

  skip_before_filter :verify_authenticity_token, :only => [:uploadFile, :removeUploadedFile]

  def index
  end

  def simulator
    @setting = IO.read('d:/ad/newwidget/src/'+params[:t]+'/setting.html')
    runtime = IO.read('d:/ad/newwidget/src/'+params[:t]+'/runtime.html')
    runtime.gsub! /[\n\r\t]/, ''
    runtime.gsub! /'/, %q[\\\']
    runtime.gsub! /\//, '\\/'
    @runtimeHTML = runtime.match(/<section\s+id="runtime">(?=(([\s\S]*?)<\\\/section>))\1/)[2]
    @runtimeJS = runtime.match(/<script\s+id="init">(?=(([\s\S]*?)<\\\/script>))\1/)[2]
    respond_to do |format|
      format.html
    end
  end

  def runtime
  	render :layout => 'runtime'
  end

  def preview
  	render :layout => 'runtime'
  end

  def template
    require 'rexml/document'
    tmplInfo = params[:info].split('-')
    tmplVar = tmplInfo.pop
    tmplData = []
    tmplInfo.each do |tmpl|
      tmplId = tmpl.split(',')[0]
      xml = REXML::Document.new File.read 'd:/ad/widgets/widget/trunk/' + tmplId + '/1/' + tmplId + '.xml' if File.exist? 'd:/ad/widgets/widget/trunk/' + tmplId + '/1/' + tmplId + '.xml'
      render :text => xml.root and return
      xml.elements.each 'Module/Content/Init' do |content|
        render :text => content.first.text and return
      end
      tmplData.push 1
    end
    #render :js => 'var' + tmplVar + '=' + tmplData
  end

  def uploadFile
  	require 'fileutils'
    file = params[:mediaUri]
    FileUtils.cp file.tempfile.path, File.join('public/files', file.original_filename)
    render :text => '<html><head><script>document.domain="renren.com";</script></head><body>' + ActiveSupport::JSON.encode({:result => 1, :mediaUri => '/files/'+file.original_filename}) + '</body></html>', :content_type => 'text/html'
  end

  def removeUploadedFile
    File.delete "#{Rails.root}/public" + params[:mediaUri]
    render :json => {:result => 1}
  end

  def adflash
    render :layout => 'runtime'
  end

  def iframe
    render :layout => 'runtime'
  end

end

  