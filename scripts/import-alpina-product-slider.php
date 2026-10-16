<?php
/** Create the slider weight field, register the slider, and add it to the homepage. */
use Drupal\canvas\Entity\Component;
use Drupal\canvas\Entity\Page;
use Drupal\canvas\Entity\JavaScriptComponent;
use Drupal\canvas_headless\ExternalComponentSync;
use Drupal\canvas_headless\FrontendUrl;
use Drupal\Core\Entity\Entity\EntityFormDisplay;
use Drupal\field\Entity\FieldConfig;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\user\Entity\Role;
use Symfony\Component\Yaml\Yaml;

$root=dirname(DRUPAL_ROOT);

// Storage for the admin Product slider order page: one weight per product.
$fieldStorage=FieldStorageConfig::loadByName('node','field_slider_weight');
if(!$fieldStorage) {
  $fieldStorage=FieldStorageConfig::create(['entity_type'=>'node','field_name'=>'field_slider_weight','type'=>'integer','cardinality'=>1,'translatable'=>FALSE,'settings'=>[]]);
  $fieldStorage->save();
}
$field=FieldConfig::loadByName('node','product','field_slider_weight');
if(!$field) {
  $field=FieldConfig::create(['entity_type'=>'node','bundle'=>'product','field_name'=>'field_slider_weight','label'=>'Slider weight','description'=>'Order used by the Alpina product slider. Rearrange products on the Product slider order page.','translatable'=>FALSE,'default_value'=>[['value'=>100]]]);
  $field->save();
}
$display=EntityFormDisplay::load('node.product.default');
if($display)$display->removeComponent('field_slider_weight')->save();

// Give every product a starting weight; new products keep their current order.
$nodeStorage=\Drupal::entityTypeManager()->getStorage('node');
$nids=$nodeStorage->getQuery()->accessCheck(FALSE)->condition('type','product')->sort('title')->execute();
$products=$nodeStorage->loadMultiple($nids);
$max=-1;
foreach($products as $product)$max=max($max,(int)($product->get('field_slider_weight')->value ?? -1));
foreach($products as $product) {
  if($product->get('field_slider_weight')->isEmpty()) {
    $product->set('field_slider_weight',++$max);
    $product->save();
  }
}

// Expose the frontend slider to Canvas, then synchronize its definition.
$config=\Drupal::configFactory()->getEditable('canvas_headless.settings');
$frontends=$config->get('frontends');$changed=FALSE;
foreach($frontends as &$frontend) {
  if($frontend['url']!=='http://localhost:3000')continue;
  if(!in_array('js.alpina_product_slider',$frontend['components'],TRUE)) {
    $frontend['components'][]='js.alpina_product_slider';sort($frontend['components']);$config->set('frontends',$frontends);$changed=TRUE;
  }
}
unset($frontend);
if($changed)$config->save();

$definitions=[];
foreach(\Drupal::config('canvas_headless.settings')->get('frontends') as $frontend) {
  if($frontend['url']!=='http://localhost:3000')continue;
  foreach($frontend['components'] as $id) {
    if($id==='js.alpina_product_slider')continue;
    $existing=JavaScriptComponent::load(substr($id,3));
    if($existing)$definitions[]=['machineName'=>$existing->id(),'name'=>$existing->label(),'status'=>$existing->status(),'props'=>$existing->get('props')?:[],'required'=>$existing->get('required')?:[],'slots'=>$existing->get('slots')?:[]];
  }
}
$data=Yaml::parseFile("$root/frontend/components/alpina_product_slider/component.yml");
$data['props']=$data['props']['properties'];
$definitions[]=$data;
$result=\Drupal::service(ExternalComponentSync::class)->synchronize(FrontendUrl::fromConfig('http://localhost:3000'),['version'=>1,'components'=>$definitions]);
if($result['errors'])throw new RuntimeException(implode("\n",$result['errors']));
echo 'Components: '.json_encode($result)."\n";

foreach(\Drupal::entityTypeManager()->getStorage('canvas_page')->loadMultiple() as $page) {
  $tree=$page->get('components')->getValue();$changedPage=FALSE;
  foreach($tree as &$item) {
    if($item['component_id']!=='js.alpina_product_slider')continue;
    $version=Component::load($item['component_id'])->getActiveVersion();
    if($item['component_version']!==$version){$item['component_version']=$version;$changedPage=TRUE;}
  }
  unset($item);
  if($changedPage){$page->set('components',$tree);$violations=$page->validate();if($violations->count())throw new RuntimeException((string)$violations);$page->save();}
}

// Source order: hero, teaser section, then the product slider.
$page=Page::load(16);$tree=$page->get('components')->getValue();
if(!array_filter($tree,static fn($item)=>$item['component_id']==='js.alpina_product_slider')) {
  $component=Component::load('js.alpina_product_slider');
  $tree[]=['uuid'=>\Drupal::service('uuid')->generate(),'parent_uuid'=>NULL,'slot'=>NULL,'component_id'=>'js.alpina_product_slider','component_version'=>$component->getActiveVersion(),'inputs'=>json_encode(['heading'=>'unsere Produkte','text'=>'Alpinaweiß Premium überzeugt als Testsieger bei Stiftung Warenstest mit höchster Deckkraft und strahlendem Weiß für ein erstklassiges Farbergebnis.','numberOfProducts'=>6],JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE)];
  $page->set('components',$tree);$violations=$page->validate();if($violations->count())throw new RuntimeException((string)$violations);$page->save();
  echo "Added the product slider to the homepage.\n";
}

$role=Role::load('administrator');
if($role&&!$role->hasPermission('administer product slider order'))$role->grantPermission('administer product slider order')->save();

echo 'Slider weight field: node.product.field_slider_weight'."\n";
echo 'Admin order page: /admin/content/product-slider-order'."\n";
echo 'Frontend: http://localhost:3000/alpina'."\n";
echo 'Editor: https://headless-lab.local/canvas/editor/canvas_page/16'."\n";
